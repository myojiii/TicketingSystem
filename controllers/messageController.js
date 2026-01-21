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

    const ticket = await TicketModel.findById(ticketId);

    if (ticket && ticket.assignedStaffId) {
      const isStaffSender = senderId === ticket.assignedStaffId;
      const isClientSender = senderId === ticket.userId;

      if (isClientSender) {
        // Notify assigned staff about client reply
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
        }
      }

      if (isStaffSender) {
        // Staff replied to client -> show badge for client
        ticket.hasAgentReply = true;
        ticket.hasClientViewed = false;
        await ticket.save();
      }
    }

    res.status(201).json({ message: "Message sent", data: newMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

const markTicketNotificationsRead = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({ message: "ticketId is required" });
    }

    await NotificationModel.updateMany(
      { ticketId: ticketId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    await TicketModel.findByIdAndUpdate(ticketId, {
      $set: { hasClientViewed: true, hasAgentReply: false },
    });

    return res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("Error marking ticket notifications as read:", err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

export { getMessages, postMessage, markTicketNotificationsRead };
