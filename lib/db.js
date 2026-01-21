import mongoose from "mongoose";

const connectMongo = async (uri) => {
  if (!uri) {
    throw new Error("MongoDB connection string is missing");
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  await mongoose.connect(uri);
};

export default connectMongo;
