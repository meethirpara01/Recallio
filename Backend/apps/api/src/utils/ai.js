import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateTags = async (text) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
        });

        const prompt = `
                        Extract 5-8 short tags from the following content.
                        Return ONLY a JSON array.

                        Content:
                        ${text.slice(0, 3000)}
                    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const raw = response.text();

        const match = raw.match(/\[.*\]/s);
        return match ? JSON.parse(match[0]) : [];

    } catch (err) {
        console.error("Gemini tagging failed:", err.message);
        return [];
    }
};