import dotenv from "dotenv";
dotenv.config({ path: "../../../.env" });
import { generateTags } from "../../api/src/utils/ai.js";
import { generateEmbedding } from "../../api/src/utils/embedding.js";

import axios from "axios";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

import mongoose from "mongoose";
await mongoose.connect(process.env.MONGO_URI);
console.log("Worker connected to MongoDB");

import { Worker } from "bullmq";
import redis from "../../api/src/config/redis.js";
import ItemModel from "../../api/src/modules/items/item.model.js";

console.log("Worker Started...");
console.log("REDIS_URL:", process.env.REDIS_URL);
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);


const worker = new Worker("item-processing", async (job) => {
  console.log("Job received!");

  const { itemId } = job.data;

  try {
    const item = await ItemModel.findById(itemId);
    if (!item) {
      console.error("Item not found:", itemId);
      return;
    }

    item.status = "processing";
    await item.save();


    // FETCH HTML
    const response = await axios.get(item.url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = response.data;

    // 1. METADATA (cheerio)
    const $ = cheerio.load(html);

    const metaTitle = $("title").text().trim();

    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") || "";


    // 2. CONTENT (readability)
    const dom = new JSDOM(html, { url: item.url });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const content = article?.textContent || "";
    const cleanedTitle = article?.title || metaTitle;

    const tags = await generateTags(content);
    console.log("🏷️ Tags:", tags);

    const embedding = await generateEmbedding(content);
    console.log("📐 Embedding length:", embedding.length);

    // 3. CONTENT QUALITY
    let contentQuality = "failed";

    if (content.length > 1000) {
      contentQuality = "good";
    } else if (content.length > 200) {
      contentQuality = "partial";
    }

    // 4. SAVE
    item.title = cleanedTitle || "No title";
    item.description = description;
    item.image = image;
    item.extractedText = content;
    item.tags = tags;
    item.embedding = embedding;
    item.contentQuality = contentQuality;
    item.status = "processed";
    item.lastProcessedAt = new Date();

    await item.save();

    console.log("Saved:", {
      title: cleanedTitle,
      contentLength: content.length,
      quality: contentQuality,
    });

  } catch (error) {
    console.error("Failed:", error.message);
    throw error;
  }
},
  {
    connection: redis
  });


// HANDLE FINAL FAILURE
worker.on("failed", async (job, err) => {
  console.log("Final failure:", err.message);

  await ItemModel.findByIdAndUpdate(job.data.itemId, {
    status: "failed",
    errorMessage: err.message,
  });
});