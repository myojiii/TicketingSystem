import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    department: String,
    number: String,
  },
  { collection: "users" }
);

export default mongoose.models.User || mongoose.model("users", userSchema);
