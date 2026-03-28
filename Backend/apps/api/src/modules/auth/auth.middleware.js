import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {

    const token = req.cookies.JWT_TOKEN;
    if (!token) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).send("Invalid token");
    }
};