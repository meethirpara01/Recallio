import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { createItem, getItems, searchItems, resurfaceItems, relatedItems } from "./item.controller.js";

const itemRouter = Router();

itemRouter.post("/items", authMiddleware, createItem);

itemRouter.get("/items", authMiddleware, getItems);

itemRouter.get("/search", authMiddleware, searchItems);

itemRouter.get("/resurface", authMiddleware, resurfaceItems);

itemRouter.get("/related/:itemId", authMiddleware, relatedItems);

export default itemRouter;