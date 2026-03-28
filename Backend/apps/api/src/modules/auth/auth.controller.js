import axios from "axios";
import { generateJwtToken } from "./auth.utils.js";
import { handleGoogleUser } from "./auth.service.js";
import { createUser, findByEmail } from "../user/user.repository.js";
import User from "../user/user.model.js";

async function redirectToGoogle(req, res) {
  const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const fullUrl = `${googleAuthUrl}?${params.toString()}`;
  console.log("GOOGLE URL:", fullUrl);
  res.redirect(fullUrl);
}


async function googleCallback(req, res) {
  const code = req.query.code;

  try {
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token } = tokenResponse.data;

    const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log("User Info:", userInfoResponse.data);

    const user = await handleGoogleUser(userInfoResponse.data);

    const token = generateJwtToken(user);

    res.cookie("JWT_TOKEN", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.status(201).json({ user });

  } catch (error) {
    console.error("Error in Google Auth:", error.response?.data || error);
    return res.status(500).send("Authentication failed");
  }
}


async function getMe(req, res) {
  const userInfo = req.user; // Assuming user is attached to req by auth middleware
  if (!userInfo) {
    return res.status(401).send("Unauthorized");
  }
  const user = await findByEmail(userInfo.email);

  if (!user) {
    return res.status(404).send("User not found");
  }

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider
    }
  });
}
async function signin(req, res) {

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).send("User not found");
  }

  if (user.provider !== "local") {
    return res.status(400).send("Please login with Google");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).send("Invalid credentials");
  }

  const token = generateJwtToken(user);
  res.cookie("JWT_TOKEN", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider
    }
  });
}

async function signup(req, res) {

  const { email, password, name } = req.body;

  const existingUser = await findByEmail(email.toLowerCase());
  if (existingUser) {
    return res.status(400).send("Email already in use");
  }

  const UserDetails = {
    googleId: null,
    email: email.toLowerCase(),
    password: password,
    name: name,
    provider: "local"
  };

  const newUser = await createUser(UserDetails);
  const token = generateJwtToken(newUser);

  res.cookie("JWT_TOKEN", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.status(201).json({
    user: {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      avatarUrl: newUser.avatarUrl,
      provider: newUser.provider
    }
  });
}

export { redirectToGoogle, googleCallback, getMe, signin, signup };