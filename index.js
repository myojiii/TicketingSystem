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
  .then(async () => {
    console.log("MongoDB connected");
    await ensureAssignedTicketsOpen();
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
    department: String,
    number: String,
  },
  { collection: "users" }
);

const UserModel = mongoose.model("users", userSchema);

// Simple in-memory seed accounts (plaintext for demo only)
const seededUsers = [
  { name: "Admin", email: "admin@gmail.com", password: "Admin123", role: "Admin", userId: "seed-admin" },
  { name: "Network Lead", email: "staff@gmail.com", password: "Staff123", role: "Staff", department: "Network", userId: "seed-staff" },
  { name: "Network Support", email: "network.staff2@gmail.com", password: "Staff123", role: "Staff", department: "Network", userId: "seed-staff-network-2" },
  { name: "Software Support", email: "software.staff@gmail.com", password: "Staff123", role: "Staff", department: "Software", userId: "seed-staff-software-1" },
  { name: "Client1", email: "client1@gmail.com", password: "Client123", role: "Client", userId: "seed-client1" },
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
    assignedStaffId: String,
    assignedStaffName: String,
    assignedDepartment: String,
    assignedAt: Date,
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
    receiverId: String,
    staffId: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "messages" }
);

const MessageModel = mongoose.model("messages", messageSchema);

const normalizeText = (value = "") => (value || "").toString().trim().toLowerCase();
const pickRandom = (list = []) => list[Math.floor(Math.random() * list.length)];

const ensureAssignedTicketsOpen = async () => {
  try {
    await TicketModel.updateMany(
      {
        assignedStaffId: { $exists: true, $ne: "" },
        $or: [
          { status: { $exists: false } },
          { status: "" },
          { status: null },
          { status: "Pending" },
        ],
      },
      { $set: { status: "Open" } }
    );
  } catch (err) {
    console.error("Error normalizing assigned tickets to Open", err);
  }
};

const findRandomStaffByDepartment = async (categoryName) => {
  const normalizedCategory = normalizeText(categoryName);
  if (!normalizedCategory) return null;

  const dbStaff = await UserModel.find({
    role: { $regex: /^staff$/i },
    department: { $exists: true, $ne: "" },
  }).lean();

  const matches = dbStaff
    .filter((staff) => normalizeText(staff.department) === normalizedCategory)
    .map((staff) => ({
      id: staff._id?.toString() || "",
      name: staff.name || "Staff",
      department: staff.department || categoryName,
      source: "db",
    }))
    .filter((staff) => !!staff.id);

  if (!matches.length) return null;

  const staffIds = matches.map((s) => s.id);

  const countsResult = await TicketModel.aggregate([
    { $match: { assignedStaffId: { $in: staffIds } } },
    { $group: { _id: "$assignedStaffId", count: { $sum: 1 } } },
  ]);

  const counts = {};
  countsResult.forEach((entry) => {
    counts[entry._id?.toString()] = entry.count || 0;
  });

  const withCounts = matches.map((staff) => ({
    ...staff,
    ticketCount: counts[staff.id] || 0,
  }));

  const minCount = Math.min(...withCounts.map((s) => s.ticketCount));
  const leastLoaded = withCounts.filter((s) => s.ticketCount === minCount);

  return pickRandom(leastLoaded);
};

const assignTicketToDepartmentStaff = async (ticketDoc, categoryName) => {
  const categoryValue = categoryName ?? ticketDoc["category name"] ?? "";
  ticketDoc["category name"] = categoryValue;

  const hasCategory = !!categoryValue && categoryValue.trim() !== "";
  if (!hasCategory) {
    ticketDoc.assignedStaffId = "";
    ticketDoc.assignedStaffName = "";
    ticketDoc.assignedDepartment = "";
    ticketDoc["category name"] = categoryValue;
    await ticketDoc.save();
    return { assigned: false, staff: null, message: "Category cleared" };
  }

  const staff = await findRandomStaffByDepartment(categoryValue);
  if (!staff) {
    ticketDoc.assignedStaffId = "";
    ticketDoc.assignedStaffName = "";
    ticketDoc.assignedDepartment = "";
    ticketDoc["category name"] = categoryValue;
    await ticketDoc.save();
    return { assigned: false, staff: null, message: "No staff available for this department" };
  }

  ticketDoc.assignedStaffId = staff.id || "";
  ticketDoc.assignedStaffName = staff.name || "";
  ticketDoc.assignedDepartment = staff.department || categoryValue;
    ticketDoc.status = "Open";
    ticketDoc.assignedAt = new Date();
  ticketDoc["category name"] = categoryValue;
  await ticketDoc.save();
  return { assigned: true, staff };
};

const normalizeTicket = (ticket, extras = {}) => ({
  id: ticket._id?.toString() || "",
  title: ticket["ticket title"] || "",
  description: ticket["ticket description"] || "",
  userId: ticket.userId || "",
  status: ticket.status || "",
  priority: ticket.priority || "",
  category: ticket["category name"] || "",
  date: ticket.date || null,
  assignedStaffId: ticket.assignedStaffId || "",
  assignedStaffName: ticket.assignedStaffName || "",
  assignedDepartment: ticket.assignedDepartment || "",
  ...extras,
});

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
  const userId = authUser._id?.toString() || authUser.userId || `seed-${role || "user"}`;

  let redirect = "/";
  if (role === "staff") redirect = "/staff";
  if (role === "admin") redirect = "/admin";
  if (role === "client") redirect = "/client";

  return res.json({
    message: "Login successful",
    role: authUser.role,
    userId,
    department: authUser.department || "",
    name: authUser.name || "",
    redirect,
  });
});

app.get("/api/users/id/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "id is required" });

  try {
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await UserModel.findById(id).lean();
    }

    if (user) {
      return res.json({
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        number: user.number || "",
        department: user.department || "",
        source: "db",
      });
    }

    const seedMatch = seededUsers.find(
      (u) => u.userId === id || `seed-${(u.role || "user").toLowerCase()}` === id
    );
    if (seedMatch) {
      return res.json({
        userId: seedMatch.userId || `seed-${(seedMatch.role || "user").toLowerCase()}`,
        role: seedMatch.role,
        name: seedMatch.name,
        email: seedMatch.email,
        number: seedMatch.number || "",
        department: seedMatch.department || "",
        source: "seed",
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Error fetching user by id", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
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
        number: user.number || "",
        department: user.department || "",
        source: "db",
      });
    }

    const seedMatch = seededUsers.find((u) => u.email === email);
    if (seedMatch) {
      return res.json({
        userId: seedMatch.userId || `seed-${(seedMatch.role || "user").toLowerCase()}`,
        role: seedMatch.role,
        name: seedMatch.name,
        number: seedMatch.number || "",
        department: seedMatch.department || "",
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
     const tickets = await TicketModel.find(filter)
      .sort({ assignedAt: -1, date: -1 })  // Changed from just { date: -1 }
      .lean();
    
    // Check for agent replies for each ticket
    const normalized = await Promise.all(tickets.map(async (t) => {
      const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
      const hasAgentReply = messages.some(m => m.senderId !== t.userId);

      return normalizeTicket(t, { hasAgentReply });
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching tickets", err);
    res.status(500).json({ message: "Failed to load tickets" });
  }
});

app.get("/api/staff/:staffId/tickets", async (req, res) => {
  try {
    const { staffId } = req.params;
    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const tickets = await TicketModel.find({ assignedStaffId: staffId }).sort({ date: -1 }).lean();

    const normalized = await Promise.all(tickets.map(async (t) => {
      const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
      const hasAgentReply = messages.some(m => m.senderId !== staffId);

      return normalizeTicket(t, { hasAgentReply });
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching staff tickets", err);
    res.status(500).json({ message: "Failed to load tickets for staff" });
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

      return normalizeTicket(t, { hasAgentReply });
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
          userId = seed.userId || `seed-${(seed.role || "user").toLowerCase()}`;
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
      assignedStaffId: "",
      assignedStaffName: "",
      assignedDepartment: "",
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

    const ticket = await TicketModel.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const assignment = await assignTicketToDepartmentStaff(ticket, category);
    const message = assignment.assigned
      ? "Category updated and staff assigned"
      : assignment.message || "Category updated successfully";

    res.json({
      message,
      ticket: normalizeTicket(ticket),
      assigned: assignment.assigned,
      staff: assignment.staff,
    });
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

    const ticket = await TicketModel.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (status !== undefined) ticket.status = status;
    if (priority !== undefined) ticket.priority = priority;

    let assignment = null;
    if (category !== undefined) {
      assignment = await assignTicketToDepartmentStaff(ticket, category);
    } else {
      await ticket.save();
    }

    const message = category !== undefined
      ? (assignment?.assigned
          ? "Ticket updated and staff assigned"
          : assignment?.message || "Ticket updated successfully")
      : "Ticket updated successfully";

    res.json({
      message,
      ticket: normalizeTicket(ticket),
      assigned: assignment?.assigned || false,
      staff: assignment?.staff || null,
    });
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

    const normalized = normalizeTicket(ticket);

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
    const { senderId, message, senderName, staffId, receiverId } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({ message: "senderId and message are required" });
    }

    // Get ticket to resolve staffId and determine receiver
    const ticket = await TicketModel.findById(ticketId).lean();
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const resolvedStaffId = staffId || ticket.assignedStaffId || "";
    
    // Determine receiverId: if sender is client, receiver is staff; if sender is staff, receiver is client
    let resolvedReceiverId = receiverId;
    if (!resolvedReceiverId) {
      if (senderId === ticket.userId) {
        // Sender is client, receiver is staff
        resolvedReceiverId = resolvedStaffId;
      } else {
        // Sender is staff, receiver is client
        resolvedReceiverId = ticket.userId;
      }
    }

    const newMessage = await MessageModel.create({
      ticketId,
      senderId,
      senderName: senderName || "User",
      receiverId: resolvedReceiverId,
      staffId: resolvedStaffId,
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
