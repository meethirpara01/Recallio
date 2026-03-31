import ItemModel from "./item.model.js";
import { itemQueue } from "./item.queue.js";
import { extractDomain, normalizeUrl } from "./item.repository.js";
import { generateEmbedding } from "../../utils/embedding.js";


export const createItem = async (req, res) => {
    const userId = req.user.id;
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: "Invalid URL" });
    }

    const normalizedUrl = normalizeUrl(url);
    console.log(normalizedUrl);
    const domain = extractDomain(url);
    console.log(domain);

    if (!domain) {
        return res.status(400).json({ error: "Invalid domain" });
    }

    try {
        const newItem = await ItemModel.create({
            userId,
            url,
            normalizedUrl,
            domain,
            status: "pending"
        });

        await itemQueue.add(
            "process-item",
            { itemId: newItem._id },
            {
                attempts: 3, // retry 3 times
                backoff: {
                    type: "exponential",
                    delay: 5000, // 5 seconds
                },
                removeOnComplete: true,
                removeOnFail: false,
            }
        );
        console.log("Job added:", newItem._id);

        return res.status(201).json({
            id: newItem._id,
            url: newItem.url,
            domain: newItem.domain,
            status: newItem.status,
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Item already saved" });
        }

        console.error("Error creating item:", error);
        return res.status(500).json({ error: "Failed to create item" });
    }
};

export const getItems = async (req, res) => {
    const userId = req.user.id;

    try {
        const items = await ItemModel.find({
            userId,
            status: { $ne: "deleted" }
        }).sort({ createdAt: -1 });

        return res.status(200).json(items);

    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ error: "Failed to fetch items" });
    }
};

export const searchItems = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user.id;

        if (!q) {
            return res.status(400).json({ error: "Query required" });
        }

        // 🔥 1. Generate query embedding
        const queryEmbedding = await generateEmbedding(q);
        console.log("Query Embedding Length:", queryEmbedding.length);

        if (!queryEmbedding || queryEmbedding.length === 0) {
            return res.status(500).json({ error: "Failed to generate embedding" });
        }

        // 🔥 2. Fetch only valid items
        const items = await ItemModel.find({
            userId,
            embedding: { $exists: true, $ne: [] },
            status: "processed",
            // contentQuality: { $ne: "failed" },
        });

        console.log("Items found:", items.length);

        // 🔥 3. Cosine similarity
        const cosineSimilarity = (a, b) => {
            let dot = 0;
            let magA = 0;
            let magB = 0;

            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                magA += a[i] * a[i];
                magB += b[i] * b[i];
            }

            return dot / (Math.sqrt(magA) * Math.sqrt(magB));
        };

        // 🔥 4. Score + boost
        const results = items
            .map((item) => {
                if (!item.embedding || item.embedding.length !== queryEmbedding.length) {
                    return null;
                }

                let score = cosineSimilarity(queryEmbedding, item.embedding);

                // ❌ skip invalid scores
                if (isNaN(score)) return null;

                // 🔥 BOOST: title match
                if (item.title?.toLowerCase().includes(q.toLowerCase())) {
                    score += 0.2;
                }

                // 🔥 BOOST: tag match
                if (item.tags?.some(tag =>
                    tag.toLowerCase().includes(q.toLowerCase())
                )) {
                    score += 0.15;
                }

                return { item, score };
            })
            .filter((r) => r && r.score > 0.6); // 🔥 threshold

        // 🔥 5. Sort best first
        results.sort((a, b) => b.score - a.score);

        console.log("Final Results:", results.map(r => r.score));

        // 🔥 6. Return top results
        return res.json(results.slice(0, 5));

    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({ error: "Search failed" });
    }
};

// export const searchItems = async (req, res) => {
//     const { q } = req.query;
//     const userId = req.user.id;

//     if (!q) {
//         return res.status(400).json({ error: "Query required" });
//     }

//     //1. Convert query → embedding
//     const queryEmbedding = await generateEmbedding(q);
//     console.log("Query Embedding Length:", queryEmbedding.length);

//     // 2. Fetch user items
//     const items = await ItemModel.find({
//         userId,
//         embedding: { $exists: true },
//     });
//     console.log("Item Embedding Length:", items[0]?.embedding?.length);

//     //3. Cosine similarity
//     const cosineSimilarity = (a, b) => {
//         let dot = 0;
//         let magA = 0;
//         let magB = 0;

//         for (let i = 0; i < a.length; i++) {
//             dot += a[i] * b[i];
//             magA += a[i] * a[i];
//             magB += b[i] * b[i];
//         }

//         return dot / (Math.sqrt(magA) * Math.sqrt(magB));
//     };

//     //4. Score items
//     const results = items.map((item) => {
//         const score = cosineSimilarity(queryEmbedding, item.embedding);
//         console.log("Score:", score);

//         return { item, score };
//     });

//     //5. Sort best first
//     results.sort((a, b) => b.score - a.score);

//     return res.json(results.slice(0, 5));
// };



export const resurfaceItems = async (req, res) => {
    try {
        const userId = req.user.id;

        const items = await ItemModel.find({
            userId,
            status: "processed",
            contentQuality: { $ne: "failed" },
        });

        const now = new Date();

        const scored = items.map((item) => {
            const daysOld =
                (now - new Date(item.createdAt)) / (1000 * 60 * 60 * 24);

            let score = 0;

            // resurfacing logic
            if (daysOld > 2) score += 0.3;
            if (daysOld > 7) score += 0.5;
            if (daysOld > 30) score += 0.8;

            return { item, score, daysOld };
        });

        const results = scored
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return res.json(results);
    } catch (err) {
        console.error("Resurface error:", err);
        res.status(500).json({ error: "Failed to resurface" });
    }
};


const cosineSimilarity = (a, b) => {
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const relatedItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const currentItem = await ItemModel.findById(itemId);

        if (!currentItem || !currentItem.embedding) {
            return res.status(404).json({ error: "Item not found" });
        }

        const items = await ItemModel.find({
            userId,
            _id: { $ne: itemId },
            embedding: { $exists: true },
        });

        const results = items
            .map((item) => {
                const score = cosineSimilarity(
                    currentItem.embedding,
                    item.embedding
                );

                return { item, score };
            })
            .filter((r) => r.score > 0.6)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return res.json(results);
    } catch (err) {
        console.error("Related error:", err);
        res.status(500).json({ error: "Failed to fetch related items" });
    }
};