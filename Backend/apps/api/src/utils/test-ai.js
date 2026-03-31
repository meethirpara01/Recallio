import "dotenv/config";
import { generateTags } from "./ai.js";

const testContent = `
React is a JavaScript library for building user interfaces.
It helps developers create reusable UI components and manage state efficiently.
It is widely used in frontend development.
`;

const runTest = async () => {
  console.log("Testing AI tagging...\n");

  const tags = await generateTags(testContent);

  console.log("Tags:", tags);
};

runTest();