import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    "category code": String,
    "category name": String,
    staffAssigned: { type: Number, default: 0 },
    ticketsReceived: { type: Number, default: 0 },
    deletedAt: Date,
  },
  { collection: "category", timestamps: true }
);

export default mongoose.models.Category || mongoose.model("Category", categorySchema, "category");
