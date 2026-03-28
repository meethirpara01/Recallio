import User from "./user.model.js";

export const findByGoogleId = async (googleId) => {
    return await User.findOne({ googleId });
};

export const findByEmail = async (email) => {
    return await User.findOne({ email });
};

export const createUser = async (userData) => {
    return await User.create(userData);
};