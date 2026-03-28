//connect to queue
import { Worker } from "bullmq";
import { itemQueue } from "../api/src/modules/items/item.queue.js";

const worker = new Worker("item-processing", async (job) => {
  console.log("Processing job:", job.id, job.data);
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("Job completed:", job.id);
}, {
  connection: itemQueue.client,
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

console.log("Worker is running and waiting for jobs...");