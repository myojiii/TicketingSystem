import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ticketId: String,
    senderId: String,
    senderName: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "messages" }
);

export default mongoose.models.Message || mongoose.model("messages", messageSchema);
