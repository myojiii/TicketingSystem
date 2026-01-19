import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    "category code": String,
    "category name": String,
  },
  { collection: "category" }
);

export default mongoose.models.Category || mongoose.model("Category", categorySchema, "category");
