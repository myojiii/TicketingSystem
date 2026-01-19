import TicketModel from "../models/Ticket.js";
import MessageModel from "../models/Message.js";
import UserModel from "../models/User.js";
import NotificationModel from "../models/Notifications.js";
import {
  normalizeTicket,
  assignTicketToDepartmentStaff,
} from "../lib/ticketHelpers.js";

const getTickets = async (req, res) => {
  try {
    const { unassigned, assigned } = req.query;
    let filter = {};

    if (unassigned === "1") {
      filter = {
        $or: [
          { "category name": { $exists: false } },
          { "category name": "" },
          { "category name": null },
        ],
      };
    } else if (assigned === "1") {
      filter = {
        "category name": { $exists: true, $ne: "", $ne: null },
      };
    }

    const tickets = await TicketModel.find(filter).sort({ date: -1 }).lean();

    const normalized = await Promise.all(
      tickets.map(async (t) => {
        const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
        const hasAgentReply = messages.some((m) => m.senderId !== t.userId);
        return normalizeTicket(t, { hasAgentReply });
      })
    );

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching tickets", err);
    res.status(500).json({ message: "Failed to load tickets" });
  }
};

const getStaffTickets = async (req, res) => {
  try {
    const { staffId } = req.params;
    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const tickets = await TicketModel.find({ assignedStaffId: staffId })
      .sort({ date: -1 })
      .lean();

    const normalized = await Promise.all(
      tickets.map(async (t) => {
        const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
        const hasAgentReply = messages.some((m) => m.senderId !== staffId);
        return normalizeTicket(t, { hasAgentReply });
      })
    );

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching staff tickets", err);
    res.status(500).json({ message: "Failed to load tickets for staff" });
  }
};

const getTicketsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const tickets = await TicketModel.find({ userId }).sort({ date: -1 }).lean();

    const normalized = await Promise.all(
      tickets.map(async (t) => {
        const messages = await MessageModel.find({ ticketId: t._id?.toString() }).lean();
        const hasAgentReply = messages.some((m) => m.senderId !== userId);
        return normalizeTicket(t, { hasAgentReply });
      })
    );

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching user tickets", err);
    res.status(500).json({ message: "Failed to load user tickets" });
  }
};

const createTicket = async (req, res) => {
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

    // Create notification for all admins
    try {
      const admins = await UserModel.find({ role: { $regex: /^admin$/i } }).lean();
      for (const admin of admins) {
        await NotificationModel.create({
          staffId: admin._id.toString(),
          type: "new_ticket",
          title: "New Ticket Submitted",
          message: `"${title}" submitted by client`,
          ticketId: doc._id.toString(),
          read: false,
        });
      }
    } catch (notifErr) {
      console.error("Error creating admin notification:", notifErr);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json({ message: "Ticket created", ticket: doc });
  } catch (err) {
    console.error("Error creating ticket", err);
    res.status(500).json({ message: "Failed to create ticket" });
  }
};

const updateCategory = async (req, res) => {
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
    
    // Create notification if ticket was assigned
    if (assignment?.assigned && assignment?.staff) {
      try {
        await NotificationModel.create({
          staffId: assignment.staff.id,
          type: "ticket_assigned",
          title: "New Ticket Assigned",
          message: `${ticket["ticket title"] || "New ticket"} assigned to you`,
          ticketId: ticket._id.toString(),
          read: false,
        });
      } catch (notifErr) {
        console.error("Error creating notification:", notifErr);
        // Don't fail the request if notification creation fails
      }
    }
    
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
};

const updateTicket = async (req, res) => {
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
      
      // Create notification if ticket was assigned
      if (assignment?.assigned && assignment?.staff) {
        try {
          await NotificationModel.create({
            staffId: assignment.staff.id,
            type: "ticket_assigned",
            title: "New Ticket Assigned",
            message: `${ticket["ticket title"] || "New ticket"} assigned to you`,
            ticketId: ticket._id.toString(),
            read: false,
          });
        } catch (notifErr) {
          console.error("Error creating notification:", notifErr);
          // Don't fail the request if notification creation fails
        }
      }
    } else {
      await ticket.save();
    }

    const message =
      category !== undefined
        ? assignment?.assigned
          ? "Ticket updated and staff assigned"
          : assignment?.message || "Ticket updated successfully"
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
};

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TicketModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await MessageModel.deleteMany({ ticketId: id });

    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    console.error("Error deleting ticket:", err);
    res.status(500).json({ message: "Failed to delete ticket" });
  }
};

const getTicket = async (req, res) => {
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
};

export {
  getTickets,
  getTicketsByUser,
  getStaffTickets,
  createTicket,
  updateCategory,
  updateTicket,
  deleteTicket,
  getTicket,
};
