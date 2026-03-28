import jwt from "jsonwebtoken";

export const generateJwtToken = (user) => {
    // Implementation for generating JWT token

    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};