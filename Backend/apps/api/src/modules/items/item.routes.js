import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { createItem, getItems, searchItems } from "./item.controller.js";

const itemRouter = Router();

itemRouter.post("/items", authMiddleware, createItem);

itemRouter.get("/items", authMiddleware, getItems);

itemRouter.get("/search", authMiddleware, searchItems);

export default itemRouter;