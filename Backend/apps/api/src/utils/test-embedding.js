import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const test = async () => {
  try {
    console.log("🧪 Testing embedding...\n");

    const result = await client.embeddings.create({
      model: "mistral-embed",
      inputs: ["React is a frontend library"],
    });

    console.log("✅ Embedding length:", result.data[0].embedding.length);

  } catch (err) {
    console.error("❌ Embedding failed:", err.message);
  }
};

test();