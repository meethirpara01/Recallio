import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { createItem, getItems } from "./item.controller.js";

const itemRouter = Router();

itemRouter.post("/items", authMiddleware, createItem);

itemRouter.get("/items", authMiddleware, getItems);

export default itemRouter;  