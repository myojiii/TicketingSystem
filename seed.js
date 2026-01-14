import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});

const UserModel = mongoose.model("users", userSchema);

async function seed() {
  await mongoose.connect(MONGO_URL);

  console.log("Connected to MongoDB for seeding");

  await UserModel.deleteMany({});

  await UserModel.insertMany([
    { name: "Admin", email: "admin@gmail.com", password: "Admin123", role: "admin" },
    { name: "Staff", email: "staff@gmail.com", password: "Staff123", role: "staff" },
    { name: "Client", email: "client@gmail.com", password: "Client123", role: "client" },
  ]);

  console.log("Seed completed");
  process.exit();
}

seed();
