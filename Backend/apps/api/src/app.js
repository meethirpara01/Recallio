import express from 'express';
import cookieParser from 'cookie-parser';
import { serverAdapter } from "./config/queue.dashboard.js";
import authRouter from './modules/auth/auth.routes.js';
import itemRouter from './modules/items/item.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/admin/queues", serverAdapter.getRouter());

app.use('/api', authRouter);
app.use('/api', itemRouter);

export default app;