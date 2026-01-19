import MessageModel from "../models/Message.js";
import TicketModel from "../models/Ticket.js";
import NotificationModel from "../models/Notifications.js";

const getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const messages = await MessageModel.find({ ticketId }).sort({ timestamp: 1 }).lean();

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

const postMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { senderId, message, senderName } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({ message: "senderId and message are required" });
    }

    const newMessage = await MessageModel.create({
      ticketId,
      senderId,
      senderName: senderName || "User",
      message,
      timestamp: new Date(),
    });

    // Get ticket to find assigned staff
    const ticket = await TicketModel.findById(ticketId);
    
    // If message is from client (not staff) and ticket has assigned staff, create notification
    if (ticket && ticket.assignedStaffId && senderId !== ticket.assignedStaffId) {
      try {
        await NotificationModel.create({
          staffId: ticket.assignedStaffId,
          type: "new_message",
          title: "New Reply",
          message: `${senderName || "Client"} replied to ${ticket["ticket title"] || "ticket"}`,
          ticketId: ticketId,
          messageId: newMessage._id.toString(),
          read: false,
        });
      } catch (notifErr) {
        console.error("Error creating notification:", notifErr);
        // Don't fail the request if notification creation fails
      }
    }

    res.status(201).json({ message: "Message sent", data: newMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

export { getMessages, postMessage };
