import UserModel from "../models/User.js";
import TicketModel from "../models/Ticket.js";

const listUsers = async (req, res) => {
  const userData = await UserModel.find();
  res.json(userData);
};

const getClientSummaries = async (req, res) => {
  try {
    const clients = await UserModel.find({
      role: { $regex: /^client$/i },
    }).lean();

    const clientIds = clients.map((u) => u._id?.toString()).filter(Boolean);

    const ticketCounts = await TicketModel.aggregate([
      { $match: { userId: { $in: clientIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    ticketCounts.forEach((entry) => {
      countMap[entry._id] = entry.count || 0;
    });

    const extractCreatedAt = (user) => {
      if (user.createdAt) return user.createdAt;
      if (user._id?.getTimestamp) return user._id.getTimestamp();
      if (user._id) {
        const tsHex = user._id.toString().slice(0, 8);
        return new Date(parseInt(tsHex, 16) * 1000);
      }
      return null;
    };

    const payload = clients.map((u) => ({
      id: u._id?.toString() || "",
      name: u.name || "",
      email: u.email || "",
      date: extractCreatedAt(u),
      tickets: countMap[u._id?.toString()] || 0,
      number: u.number || "",
      city: u.city || "",
      province: u.province || "",
    }));

    res.json(payload);
  } catch (err) {
    console.error("Error fetching client summaries", err);
    res.status(500).json({ message: "Failed to load clients" });
  }
};

const getStaffSummaries = async (req, res) => {
  try {
    const staff = await UserModel.find({
      role: { $regex: /^staff$/i },
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    }).lean();

    const staffIds = staff.map((u) => u._id?.toString()).filter(Boolean);

    const ticketCounts = await TicketModel.aggregate([
      { $match: { assignedStaffId: { $in: staffIds } } },
      { $group: { _id: "$assignedStaffId", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    ticketCounts.forEach((entry) => {
      countMap[entry._id] = entry.count || 0;
    });

    const extractCreatedAt = (user) => {
      if (user.createdAt) return user.createdAt;
      if (user._id?.getTimestamp) return user._id.getTimestamp();
      if (user._id) {
        const tsHex = user._id.toString().slice(0, 8);
        return new Date(parseInt(tsHex, 16) * 1000);
      }
      return null;
    };

    const payload = staff.map((u) => ({
      id: u._id?.toString() || "",
      name: u.name || "",
      department: u.department || "",
      date: extractCreatedAt(u),
      tickets: countMap[u._id?.toString()] || 0,
      number: u.number || "",
      city: u.city || "",
      province: u.province || "",
      email: u.email || "",
    }));

    res.json(payload);
  } catch (err) {
    console.error("Error fetching staff summaries", err);
    res.status(500).json({ message: "Failed to load staff" });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, password, department, number } = req.body || {};

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "name, email, password, and department are required" });
    }

    const existing = await UserModel.findOne({ email: new RegExp(`^${email}$`, "i") }).lean();
    if (existing?._id) {
      return res.status(409).json({ message: "A user with that email already exists" });
    }

    const doc = await UserModel.create({
      name,
      email,
      password,
      department,
      number: number || "",
      role: "Staff",
    });

    return res.status(201).json({
      message: "Staff created",
      staff: {
        id: doc._id?.toString() || "",
        name: doc.name,
        email: doc.email,
        department: doc.department,
        date: doc.createdAt,
        tickets: 0,
        number: doc.number || "",
        city: doc.city || "",
        province: doc.province || "",
      },
    });
  } catch (err) {
    console.error("Error creating staff", err);
    return res.status(500).json({ message: "Failed to create staff" });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, number, city, province } = req.body || {};

    const updates = {};
    if (department !== undefined) updates.department = department;
    if (number !== undefined) updates.number = number;
    if (city !== undefined) updates.city = city;
    if (province !== undefined) updates.province = province;

    const doc = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!doc) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const ticketCount = await TicketModel.countDocuments({ assignedStaffId: id });

    return res.json({
      message: "Staff updated",
      staff: {
        id: doc._id?.toString() || "",
        name: doc.name,
        email: doc.email,
        department: doc.department,
        date: doc.createdAt,
        tickets: ticketCount || 0,
        number: doc.number || "",
        city: doc.city || "",
        province: doc.province || "",
      },
    });
  } catch (err) {
    console.error("Error updating staff", err);
    return res.status(500).json({ message: "Failed to update staff" });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const doc = await UserModel.findOneAndUpdate(
      { _id: id, role: { $regex: /^staff$/i } },
      { $set: { deletedAt: now } },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ message: "Staff not found" });
    }

    return res.json({ message: "Staff deleted", deletedAt: now.toISOString() });
  } catch (err) {
    console.error("Error deleting staff", err);
    return res.status(500).json({ message: "Failed to delete staff" });
  }
};

export { listUsers, getClientSummaries, getStaffSummaries, createStaff, updateStaff, deleteStaff };
