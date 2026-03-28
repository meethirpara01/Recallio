import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

import authRouter from './modules/auth/auth.routes.js';

app.use('/api', authRouter);
app.use('/api', authRouter);

import itemRouter from './modules/items/item.routes.js';

app.use('/api', itemRouter);

export default app;