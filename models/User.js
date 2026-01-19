import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    department: String,
    number: String,
    city: String,
    province: String,
    deletedAt: Date,
  },
  { collection: "users", timestamps: true }
);

export default mongoose.models.User || mongoose.model("users", userSchema);
