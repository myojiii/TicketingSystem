import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/Ticketing";
const rootDir = process.cwd();

app.use(express.json());
app.use(express.static(path.join(rootDir, "public")));
app.use("/staff", express.static(path.join(rootDir, "public", "staff")));
app.use("/admin", express.static(path.join(rootDir, "public", "admin")));
app.use("/client", express.static(path.join(rootDir, "public", "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "public", "auth", "login.html"));
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
  },
  { collection: "users" }
);

const UserModel = mongoose.model("users", userSchema);

// Simple in-memory seed accounts (plaintext for demo only)
const seededUsers = [
  { name: "Admin", email: "admin@gmail.com", password: "Admin123", role: "Admin" },
  { name: "Staff", email: "staff@gmail.com", password: "Staff123", role: "Staff" },
  { name: "Client1", email: "client1@gmail.com", password: "Client123", role: "Client" },
];

const categorySchema = new mongoose.Schema(
  {
    "category code": String,
    "category name": String,
  },
  { collection: "category" }
);

const CategoryModel = mongoose.model("Category", categorySchema, "category");

app.get("/getUsers", async (req, res) => {
  const userData = await UserModel.find();
  res.json(userData);
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await CategoryModel.find().lean();

    const normalized = categories.map((cat) => ({
      code: cat["category code"] || cat.categoryCode || "",
      name: cat["category name"] || cat.categoryName || cat.name || "",
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching categories", err);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // Try DB first
  const user = await UserModel.findOne({ email });
  const isDbMatch = user && user.password === password;

  // Fallback to seeded accounts
  const seedMatch = seededUsers.find((u) => u.email === email && u.password === password);

  if (!isDbMatch && !seedMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const authUser = isDbMatch ? user : seedMatch;

  const role = user.role?.toLowerCase() || "";
  let redirect = "/";
  if (role === "staff") redirect = "/staff";
  if (role === "admin") redirect = "/admin";
  if (role === "client") redirect = "/client";

  return res.json({
    message: "Login successful",
    role: authUser.role,
    redirect,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
