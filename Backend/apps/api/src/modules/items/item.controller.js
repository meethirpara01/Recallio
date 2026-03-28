import ItemModel from "./item.model.js";
import { extractDomain, normalizeUrl } from "./item.repository.js";


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
    console.log(normalizeUrl);
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
            status: "PENDING"
        });

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
            status: { $ne: "DELETED" }
        }).sort({ createdAt: -1 });

        return res.status(200).json(items);

    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ error: "Failed to fetch items" });
    }
};