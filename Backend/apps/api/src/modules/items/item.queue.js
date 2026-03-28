import { Queue } from "bullmq";
import redis from "../../config/redis.js";

export const itemQueue = new Queue("item-processing", {
  connection: redis,
});