import { findByGoogleId, findByEmail, createUser } from "../user/user.repository.js";

export const handleGoogleUser = async (googleUserData) => {
    // 1. Check if user exists by googleId
    let user = await findByGoogleId(googleUserData.sub);
    if (user) {
        return user;
    }

    // 2. If not, check if user exists by email
    user = await findByEmail(googleUserData.email.toLowerCase());
    if (user) {
        // 3. If user exists by email, update googleId
        user.googleId = googleUserData.sub;
        await user.save();
        return user;
    }

    // 4. If user doesn't exist, create new user
    const newUser = {
        googleId: googleUserData.sub,
        email: googleUserData.email.toLowerCase(),
        password: null,
        name: googleUserData.name,
        avatarUrl: googleUserData.picture,
        provider: "google"
    };
    const createdUser = await createUser(newUser);
    return createdUser;
};
