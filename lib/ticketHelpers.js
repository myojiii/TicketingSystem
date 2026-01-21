import TicketModel from "../models/Ticket.js";
import UserModel from "../models/User.js";

const normalizeText = (value = "") => (value || "").toString().trim().toLowerCase();
const pickRandom = (list = []) => list[Math.floor(Math.random() * list.length)];

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
   hasAgentReply: extras.hasAgentReply ?? ticket.hasAgentReply ?? false,
   hasClientViewed: extras.hasClientViewed ?? ticket.hasClientViewed ?? false,
  ...extras,
});

const findRandomStaffByDepartment = async (categoryName) => {
  const normalizedCategory = normalizeText(categoryName);
  if (!normalizedCategory) return null;

  const dbStaff = await UserModel.find({
    role: { $regex: /^staff$/i },
    department: { $exists: true, $ne: "" },
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
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
  ticketDoc["category name"] = categoryValue;
  await ticketDoc.save();
  return { assigned: true, staff };
};

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

export {
  normalizeText,
  normalizeTicket,
  findRandomStaffByDepartment,
  assignTicketToDepartmentStaff,
  ensureAssignedTicketsOpen,
};
