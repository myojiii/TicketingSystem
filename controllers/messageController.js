import MessageModel from "../models/Message.js";

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

    res.status(201).json({ message: "Message sent", data: newMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

export { getMessages, postMessage };
