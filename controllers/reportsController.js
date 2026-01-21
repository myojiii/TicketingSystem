import TicketModel from "../models/Ticket.js";
import CategoryModel from "../models/Category.js";
import UserModel from "../models/User.js";
import NotificationModel from "../models/Notifications.js";

// Helper function to parse date filters
const parseDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) {
    filter.$gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return Object.keys(filter).length > 0 ? filter : null;
};

// 1. Tickets per Category Report
const getTicketsPerCategory = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Build query filter
    const filter = {};
    
    // Date filter
    const dateFilter = parseDateFilter(startDate, endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    // Department filter
    if (department && department !== "all") {
      filter.assignedDepartment = department;
    }

    // Aggregate tickets by category
    const categoryStats = await TicketModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate total and percentages
    const total = categoryStats.reduce((sum, cat) => sum + cat.count, 0);
    
    const categoriesWithPercentage = categoryStats.map((cat) => ({
      category: cat._id || "Unassigned",
      count: cat.count,
      percentage: total > 0 ? ((cat.count / total) * 100).toFixed(2) : 0,
    }));

    res.json({
      total,
      categories: categoriesWithPercentage,
    });
  } catch (err) {
    console.error("Error fetching tickets per category:", err);
    res.status(500).json({ message: "Failed to load category statistics" });
  }
};

// 2. Resolution Time Analysis Report
const getResolutionTimeAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, category, priority, staffId } = req.query;

    // Build query filter
    const filter = { status: "Closed" };

    // Date filter
    const dateFilter = parseDateFilter(startDate, endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    // Category filter
    if (category && category !== "all") {
      filter["category name"] = category;
    }

    // Priority filter
    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    // Staff filter
    if (staffId && staffId !== "all") {
      filter.assignedStaffId = staffId;
    }

    // Fetch closed tickets
    const closedTickets = await TicketModel.find(filter).lean();

    if (closedTickets.length === 0) {
      return res.json({
        totalResolved: 0,
        averageResolutionTime: 0,
        fastestResolution: 0,
        slowestResolution: 0,
        byCategory: [],
        byStaff: [],
        byPriority: [],
        overdue: [],
      });
    }

    // Calculate resolution times (in hours)
    const ticketsWithResolution = closedTickets.map((ticket) => {
      const createdDate = new Date(ticket.date);
      const resolvedDate = new Date(ticket.updatedAt || ticket.date);
      const resolutionTimeHours = (resolvedDate - createdDate) / (1000 * 60 * 60);
      
      return {
        ...ticket,
        resolutionTimeHours: Math.max(resolutionTimeHours, 0),
      };
    });

    const resolutionTimes = ticketsWithResolution.map((t) => t.resolutionTimeHours);
    const averageResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    const fastestResolution = Math.min(...resolutionTimes);
    const slowestResolution = Math.max(...resolutionTimes);

    // Group by category
    const byCategory = {};
    ticketsWithResolution.forEach((ticket) => {
      const cat = ticket["category name"] || "Unassigned";
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, sum: 0 };
      }
      byCategory[cat].total++;
      byCategory[cat].sum += ticket.resolutionTimeHours;
    });

    const categoryStats = Object.entries(byCategory).map(([category, stats]) => ({
      category,
      averageTime: (stats.sum / stats.total).toFixed(2),
      totalResolved: stats.total,
    }));

    // Group by staff
    const byStaff = {};
    ticketsWithResolution.forEach((ticket) => {
      const staff = ticket.assignedStaffName || "Unassigned";
      if (!byStaff[staff]) {
        byStaff[staff] = { total: 0, sum: 0 };
      }
      byStaff[staff].total++;
      byStaff[staff].sum += ticket.resolutionTimeHours;
    });

    const staffStats = Object.entries(byStaff).map(([staffName, stats]) => ({
      staffName,
      averageTime: (stats.sum / stats.total).toFixed(2),
      totalResolved: stats.total,
    }));

    // Group by priority
    const byPriority = {};
    ticketsWithResolution.forEach((ticket) => {
      const pri = ticket.priority || "Not Set";
      if (!byPriority[pri]) {
        byPriority[pri] = { total: 0, sum: 0 };
      }
      byPriority[pri].total++;
      byPriority[pri].sum += ticket.resolutionTimeHours;
    });

    const priorityStats = Object.entries(byPriority).map(([priority, stats]) => ({
      priority,
      averageTime: (stats.sum / stats.total).toFixed(2),
      totalResolved: stats.total,
    }));

    // Find overdue tickets (open tickets older than 48 hours)
    const overdueFilter = {
      status: { $ne: "Closed" },
      date: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    };

    const overdueTickets = await TicketModel.find(overdueFilter)
      .select("ticket title category name priority assignedStaffName date status")
      .lean();

    const overdueWithAge = overdueTickets.map((ticket) => {
      const ageHours = (Date.now() - new Date(ticket.date)) / (1000 * 60 * 60);
      return {
        id: ticket._id,
        title: ticket["ticket title"],
        category: ticket["category name"] || "Unassigned",
        priority: ticket.priority || "Not Set",
        assignedTo: ticket.assignedStaffName || "Unassigned",
        ageHours: ageHours.toFixed(2),
        status: ticket.status,
      };
    });

    res.json({
      totalResolved: closedTickets.length,
      averageResolutionTime: averageResolutionTime.toFixed(2),
      fastestResolution: fastestResolution.toFixed(2),
      slowestResolution: slowestResolution.toFixed(2),
      byCategory: categoryStats,
      byStaff: staffStats,
      byPriority: priorityStats,
      overdue: overdueWithAge,
    });
  } catch (err) {
    console.error("Error fetching resolution time analysis:", err);
    res.status(500).json({ message: "Failed to load resolution time analysis" });
  }
};

// 3. Ticket Volume Trends Report
const getTicketVolumeTrends = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    // Build query filter
    const filter = {};
    
    const dateFilter = parseDateFilter(startDate, endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    // Determine grouping format
    let groupFormat;
    switch (groupBy) {
      case "week":
        groupFormat = { $week: "$date" };
        break;
      case "month":
        groupFormat = { $month: "$date" };
        break;
      case "day":
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
    }

    // Aggregate opened tickets
    const openedTickets = await TicketModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Aggregate resolved tickets (using updatedAt for closed tickets)
    const resolvedTickets = await TicketModel.aggregate([
      {
        $match: {
          status: "Closed",
          ...(dateFilter && { updatedAt: dateFilter }),
        },
      },
      {
        $group: {
          _id:
            groupBy === "day"
              ? { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }
              : groupBy === "week"
              ? { $week: "$updatedAt" }
              : { $month: "$updatedAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge data
    const allPeriods = new Set([
      ...openedTickets.map((t) => t._id),
      ...resolvedTickets.map((t) => t._id),
    ]);

    const trends = Array.from(allPeriods)
      .sort()
      .map((period) => {
        const opened = openedTickets.find((t) => t._id === period)?.count || 0;
        const resolved = resolvedTickets.find((t) => t._id === period)?.count || 0;

        return {
          period: period.toString(),
          opened,
          resolved,
          net: opened - resolved,
        };
      });

    res.json({ trends, groupBy });
  } catch (err) {
    console.error("Error fetching ticket volume trends:", err);
    res.status(500).json({ message: "Failed to load ticket volume trends" });
  }
};

// 4. Export Report Data
const exportReportData = async (req, res) => {
  try {
    const { reportType, format = "csv", ...filters } = req.query;

    let reportData;
    let fileName;

    // Fetch report data based on type
    switch (reportType) {
      case "category":
        reportData = await generateCategoryExport(filters);
        fileName = `tickets_per_category_${Date.now()}`;
        break;
      case "resolution":
        reportData = await generateResolutionExport(filters);
        fileName = `resolution_time_analysis_${Date.now()}`;
        break;
      case "trends":
        reportData = await generateTrendsExport(filters);
        fileName = `ticket_volume_trends_${Date.now()}`;
        break;
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }

    if (format === "csv") {
      // Generate CSV
      const csv = convertToCSV(reportData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}.csv"`);
      res.send(csv);
    } else {
      // Return JSON for PDF generation on client side
      res.json({ data: reportData, fileName });
    }
  } catch (err) {
    console.error("Error exporting report:", err);
    res.status(500).json({ message: "Failed to export report" });
  }
};

// Helper: Generate category export data
const generateCategoryExport = async (filters) => {
  const { startDate, endDate, department } = filters;
  const filter = {};

  const dateFilter = parseDateFilter(startDate, endDate);
  if (dateFilter) filter.date = dateFilter;
  if (department && department !== "all") filter.assignedDepartment = department;

  const categoryStats = await TicketModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$category name",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const total = categoryStats.reduce((sum, cat) => sum + cat.count, 0);

  return categoryStats.map((cat) => ({
    Category: cat._id || "Unassigned",
    "Total Tickets": cat.count,
    Percentage: total > 0 ? ((cat.count / total) * 100).toFixed(2) + "%" : "0%",
  }));
};

// Helper: Generate resolution export data
const generateResolutionExport = async (filters) => {
  const { startDate, endDate, category, priority, staffId } = filters;
  const filter = { status: "Closed" };

  const dateFilter = parseDateFilter(startDate, endDate);
  if (dateFilter) filter.date = dateFilter;
  if (category && category !== "all") filter["category name"] = category;
  if (priority && priority !== "all") filter.priority = priority;
  if (staffId && staffId !== "all") filter.assignedStaffId = staffId;

  const tickets = await TicketModel.find(filter).lean();

  return tickets.map((ticket) => {
    const createdDate = new Date(ticket.date);
    const resolvedDate = new Date(ticket.updatedAt || ticket.date);
    const resolutionHours = ((resolvedDate - createdDate) / (1000 * 60 * 60)).toFixed(2);

    return {
      "Ticket ID": ticket._id,
      Title: ticket["ticket title"],
      Category: ticket["category name"] || "Unassigned",
      Priority: ticket.priority || "Not Set",
      "Assigned To": ticket.assignedStaffName || "Unassigned",
      "Created Date": createdDate.toLocaleDateString(),
      "Resolved Date": resolvedDate.toLocaleDateString(),
      "Resolution Time (Hours)": resolutionHours,
    };
  });
};

// Helper: Generate trends export data
const generateTrendsExport = async (filters) => {
  const { startDate, endDate, groupBy = "day" } = filters;
  const filter = {};

  const dateFilter = parseDateFilter(startDate, endDate);
  if (dateFilter) filter.date = dateFilter;

  let groupFormat;
  switch (groupBy) {
    case "week":
      groupFormat = { $week: "$date" };
      break;
    case "month":
      groupFormat = { $month: "$date" };
      break;
    case "day":
    default:
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
      break;
  }

  const openedTickets = await TicketModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: groupFormat,
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const resolvedTickets = await TicketModel.aggregate([
    {
      $match: {
        status: "Closed",
        ...(dateFilter && { updatedAt: dateFilter }),
      },
    },
    {
      $group: {
        _id:
          groupBy === "day"
            ? { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }
            : groupBy === "week"
            ? { $week: "$updatedAt" }
            : { $month: "$updatedAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const allPeriods = new Set([
    ...openedTickets.map((t) => t._id),
    ...resolvedTickets.map((t) => t._id),
  ]);

  return Array.from(allPeriods)
    .sort()
    .map((period) => {
      const opened = openedTickets.find((t) => t._id === period)?.count || 0;
      const resolved = resolvedTickets.find((t) => t._id === period)?.count || 0;

      return {
        Period: period.toString(),
        "Tickets Opened": opened,
        "Tickets Resolved": resolved,
        "Net Change": opened - resolved,
      };
    });
};

// Helper: Convert JSON to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
};

// Get filter options (departments, categories, staff)
const getFilterOptions = async (req, res) => {
  try {
    const departmentsFromUsers = await UserModel.distinct("department", {
      department: { $exists: true, $ne: "" },
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    });

    const categoriesDocs = await CategoryModel.find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    })
      .select("category name")
      .lean();

    const categoryNames = categoriesDocs
      .map((c) => c["category name"] || c.categoryName || c.name)
      .filter(Boolean);

    const ticketCategories = await TicketModel.distinct("category name", {
      "category name": { $exists: true, $ne: "" },
    });

    const departments = Array.from(new Set([...categoryNames, ...departmentsFromUsers])).filter(Boolean);

    // Get all staff members
    const staff = await UserModel.find({
      role: { $regex: /^staff$/i },
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    })
      .select("_id name department")
      .lean();

    res.json({
      departments: Array.from(new Set([...departments, ...ticketCategories])).filter(Boolean),
      categories: categoryNames,
      staff: staff.map((s) => ({
        id: s._id,
        name: s.name,
        department: s.department,
      })),
    });
  } catch (err) {
    console.error("Error fetching filter options:", err);
    res.status(500).json({ message: "Failed to load filter options" });
  }
};

export {
  getTicketsPerCategory,
  getResolutionTimeAnalysis,
  getTicketVolumeTrends,
  exportReportData,
  getFilterOptions,
};
