import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/Ticketing";
const rootDir = process.cwd();

app.use(express.json());
app.use(express.static(path.join(rootDir, "public")));
app.use("/staff", express.static(path.join(rootDir, "public", "staff")));
app.use("/admin", express.static(path.join(rootDir, "public", "admin")));
app.use("/client", express.static(path.join(rootDir, "public", "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "public", "auth", "login.html"));
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
  },
  { collection: "users" }
);

const UserModel = mongoose.model("users", userSchema);

// Simple in-memory seed accounts (plaintext for demo only)
const seededUsers = [
  { name: "Admin", email: "admin@gmail.com", password: "Admin123", role: "Admin" },
  { name: "Staff", email: "staff@gmail.com", password: "Staff123", role: "Staff" },
  { name: "Client1", email: "client1@gmail.com", password: "Client123", role: "Client" },
];

const categorySchema = new mongoose.Schema(
  {
    "category code": String,
    "category name": String,
  },
  { collection: "category" }
);

const CategoryModel = mongoose.model("Category", categorySchema, "category");

const ticketSchema = new mongoose.Schema(
  {
    "ticket title": String,
    "ticket description": String,
    userId: String,
    date: Date,
    status: String,
    priority: String,
    "category name": String,
  },
  { collection: "tickets" }
);

const TicketModel = mongoose.model("tickets", ticketSchema);

// Message Schema for chat functionality
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

const MessageModel = mongoose.model("messages", messageSchema);

app.get("/getUsers", async (req, res) => {
  const userData = await UserModel.find();
  res.json(userData);
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await CategoryModel.find().lean();

    const normalized = categories.map((cat) => ({
      code: cat["category code"] || cat.categoryCode || "",
      name: cat["category name"] || cat.categoryName || cat.name || "",
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching categories", err);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // Try DB first
  const user = await UserModel.findOne({ email });
  const isDbMatch = user && user.password === password;

  // Fallback to seeded accounts
  const seedMatch = seededUsers.find((u) => u.email === email && u.password === password);

  if (!isDbMatch && !seedMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const authUser = isDbMatch ? user : seedMatch;
  const role = (authUser.role || "").toLowerCase();
  const userId = authUser._id ? authUser._id.toString() : `seed-${role || "user"}`;

  let redirect = "/";
  if (role === "staff") redirect = "/staff";
  if (role === "admin") redirect = "/admin";
  if (role === "client") redirect = "/client";

  return res.json({
    message: "Login successful",
    role: authUser.role,
    userId,
    redirect,
  });
});

app.get("/api/users/by-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "email is required" });

  try {
    const user = await UserModel.findOne({ email: new RegExp(`^${email}$`, "i") }).lean();
    if (user?._id) {
      return res.json({
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        source: "db",
      });
    }

    const seedMatch = seededUsers.find((u) => u.email === email);
    if (seedMatch) {
      return res.json({
        userId: `seed-${(seedMatch.role || "user").toLowerCase()}`,
        role: seedMatch.role,
        name: seedMatch.name,
        source: "seed",
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Error fetching user by email", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

// GET ALL TICKETS (for admin/staff)
app.get("/api/tickets", async (req, res) => {
  try {
    const { unassigned, assigned } = req.query;
    let filter = {};

    if (unassigned === "1") {
      filter = {
        $or: [
          { "category name": { $exists: false } },
          { "category name": "" },
          { "category name": null },
        ]
      };
    } 
    else if (assigned === "1") {
      filter = {
        "category name": { $exists: true, $ne: "", $ne: null }
      };
    }

    const tickets = await TicketModel.find(filter).sort({ date: -1 }).lean();
    
    // Check for agent replies for each ticket
    const normalized = await Promise.all(tickets.map(async (t) => {
      const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
      const hasAgentReply = messages.some(m => m.senderId !== t.userId);
      
      return {
        id: t._id?.toString() || "",
        title: t["ticket title"] || "",
        description: t["ticket description"] || "",
        userId: t.userId || "",
        status: t.status || "",
        priority: t.priority || "",
        category: t["category name"] || "",
        date: t.date || null,
        hasAgentReply,
      };
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching tickets", err);
    res.status(500).json({ message: "Failed to load tickets" });
  }
});

// GET TICKETS BY USER ID (for client dashboard)
app.get("/api/tickets/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const tickets = await TicketModel.find({ userId }).sort({ date: -1 }).lean();
    
    // Check for agent replies for each ticket
    const normalized = await Promise.all(tickets.map(async (t) => {
      const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
      const hasAgentReply = messages.some(m => m.senderId !== userId);
      
      return {
        id: t._id?.toString() || "",
        title: t["ticket title"] || "",
        description: t["ticket description"] || "",
        userId: t.userId || "",
        status: t.status || "",
        priority: t.priority || "",
        category: t["category name"] || "",
        date: t.date || null,
        hasAgentReply,
      };
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching user tickets", err);
    res.status(500).json({ message: "Failed to load user tickets" });
  }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const { title, description, userId: incomingUserId, email } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "title and description are required." });
    }

    let userId = incomingUserId;

    if (!userId && email) {
      const dbUser = await UserModel.findOne({ email: new RegExp(`^${email}$`, "i") }).lean();
      if (dbUser?._id) {
        userId = dbUser._id.toString();
      } else {
        const seed = seededUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (seed) {
          userId = `seed-${(seed.role || "user").toLowerCase()}`;
        }
      }
    }

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const doc = await TicketModel.create({
      "ticket title": title,
      "ticket description": description,
      userId,
      date: new Date(),
      status: "Pending",
      priority: "",
      "category name": "",
    });

    res.status(201).json({ message: "Ticket created", ticket: doc });
  } catch (err) {
    console.error("Error creating ticket", err);
    res.status(500).json({ message: "Failed to create ticket" });
  }
});

// UPDATE TICKET CATEGORY
app.put("/api/tickets/:id/category", async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const result = await TicketModel.findByIdAndUpdate(
      id,
      { "category name": category },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Category updated successfully", ticket: result });
  } catch (err) {
    console.error("Error updating ticket category:", err);
    res.status(500).json({ message: "Failed to update category" });
  }
});

// UPDATE TICKET
app.put("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, status, priority } = req.body;

    const updates = {};
    if (category !== undefined) updates["category name"] = category;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;

    const result = await TicketModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Ticket updated successfully", ticket: result });
  } catch (err) {
    console.error("Error updating ticket:", err);
    res.status(500).json({ message: "Failed to update ticket" });
  }
});

// DELETE TICKET
app.delete("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TicketModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Also delete associated messages
    await MessageModel.deleteMany({ ticketId: id });

    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    console.error("Error deleting ticket:", err);
    res.status(500).json({ message: "Failed to delete ticket" });
  }
});

// GET SINGLE TICKET
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await TicketModel.findById(id).lean();

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const normalized = {
      id: ticket._id?.toString() || "",
      title: ticket["ticket title"] || "",
      description: ticket["ticket description"] || "",
      userId: ticket.userId || "",
      status: ticket.status || "",
      priority: ticket.priority || "",
      category: ticket["category name"] || "",
      date: ticket.date || null,
    };

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching ticket:", err);
    res.status(500).json({ message: "Failed to fetch ticket" });
  }
});

// ========================================
// CHAT/MESSAGE ENDPOINTS
// ========================================

// GET MESSAGES FOR A TICKET
app.get("/api/tickets/:ticketId/messages", async (req, res) => {
  try {
    const { ticketId } = req.params;

    const messages = await MessageModel.find({ ticketId })
      .sort({ timestamp: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// POST A MESSAGE TO A TICKET
app.post("/api/tickets/:ticketId/messages", async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});