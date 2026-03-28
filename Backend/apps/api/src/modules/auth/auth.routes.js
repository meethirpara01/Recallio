import { Router } from "express";
import { redirectToGoogle, googleCallback, getMe, signin, signup } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";

const authRouter = Router();

authRouter.get("/auth/google", redirectToGoogle);

authRouter.get("/auth/google/callback", googleCallback);

authRouter.get("/auth/me", authMiddleware, getMe);

authRouter.post("/auth/signin", signin);

authRouter.post("/auth/signup", signup);

export default authRouter;