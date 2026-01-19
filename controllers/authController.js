import UserModel from "../models/User.js";
import { normalizeText } from "../lib/ticketHelpers.js";

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await UserModel.findOne({ email });
  const isDbMatch = user && user.password === password;

  if (!isDbMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const authUser = user;
  const role = (authUser.role || "").toLowerCase();
  const userId = authUser._id?.toString() || `user-${role || "user"}`;

  let redirect = "/";
  if (role === "staff") redirect = "/staff";
  if (role === "admin") redirect = "/admin";
  if (role === "client") redirect = "/client";

  return res.json({
    message: "Login successful",
    role: authUser.role,
    userId,
    department: authUser.department || "",
    name: authUser.name || "",
    redirect,
  });
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "id is required" });

  try {
    let user = null;

    if (id && id.length === 24) {
      user = await UserModel.findById(id).lean();
    } else {
      user = await UserModel.findById(id).lean();
    }

    if (user) {
      return res.json({
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        number: user.number || "",
        city: user.city || "",
        province: user.province || "",
        department: user.department || "",
        source: "db",
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Error fetching user by id", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

const getUserByEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "email is required" });

  try {
    const user = await UserModel.findOne({ email: new RegExp(`^${email}$`, "i") }).lean();
    if (user?._id) {
      return res.json({
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        number: user.number || "",
        email: user.email,
        department: user.department || "",
        source: "db",
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Error fetching user by email", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

export { login, getUserById, getUserByEmail };
