import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export const generateEmbedding = async (text) => {
  try {
    const result = await client.embeddings.create({
      model: "mistral-embed",
      inputs: [text.slice(0, 8000)],
    });

    return result.data[0].embedding;

  } catch (err) {
    console.error("Embedding failed:", err.message);
    return [];
  }
};