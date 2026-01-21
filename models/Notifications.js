import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["new_ticket", "ticket_assigned", "new_message", "status_changed", "priority_changed"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  ticketId: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

notificationSchema.index({ staffId: 1, read: 1, createdAt: -1 });

const NotificationModel = mongoose.model("Notification", notificationSchema);

export default NotificationModel;