import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  department: String,
});

const UserModel = mongoose.model("users", userSchema);

async function seed() {
  await mongoose.connect(MONGO_URL);

  console.log("Connected to MongoDB for seeding");

  await UserModel.deleteMany({});

  await UserModel.insertMany([
    { name: "Admin", email: "admin@gmail.com", password: "Admin123", role: "Admin" },
    { name: "Network Lead", email: "staff@gmail.com", password: "Staff123", role: "Staff", department: "Network" },
    { name: "Network Support", email: "network.staff2@gmail.com", password: "Staff123", role: "Staff", department: "Network" },
    { name: "Software Support", email: "software.staff@gmail.com", password: "Staff123", role: "Staff", department: "Software" },
    { name: "Client", email: "client@gmail.com", password: "Client123", role: "Client" },
  ]);

  console.log("Seed completed");
  process.exit();
}

seed();
