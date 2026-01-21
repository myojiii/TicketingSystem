import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    "ticket title": String,
    "ticket description": String,
    userId: String,
    date: Date,
    status: String,
    priority: String,
    "category name": String,
    assignedStaffId: String,
    assignedStaffName: String,
    assignedDepartment: String,
    hasAgentReply: { type: Boolean, default: false },
    hasClientViewed: { type: Boolean, default: false },
  },
  { collection: "tickets" }
);

export default mongoose.models.Ticket || mongoose.model("tickets", ticketSchema);
