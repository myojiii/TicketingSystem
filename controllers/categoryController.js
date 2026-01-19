import CategoryModel from "../models/Category.js";
import UserModel from "../models/User.js";
import TicketModel from "../models/Ticket.js";
import { normalizeText } from "../lib/ticketHelpers.js";

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    }).lean();

    const normalized = categories.map((cat) => ({
      code: cat["category code"] || cat.categoryCode || "",
      name: cat["category name"] || cat.categoryName || cat.name || "",
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching categories", err);
    res.status(500).json({ message: "Failed to load categories" });
  }
};

const getCategorySummaries = async (req, res) => {
  try {
    const categories = await CategoryModel.find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    }).lean();

    const staff = await UserModel.find({
      role: { $regex: /^staff$/i },
      department: { $exists: true, $ne: "" },
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    }).lean();

    const staffMap = staff.reduce((acc, user) => {
      const key = normalizeText(user.department);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const ticketAgg = await TicketModel.aggregate([
      { $match: { "category name": { $exists: true, $ne: "" } } },
      { $group: { _id: "$category name", count: { $sum: 1 } } },
    ]);

    const ticketMap = {};
    ticketAgg.forEach((entry) => {
      const key = normalizeText(entry._id);
      if (!key) return;
      ticketMap[key] = entry.count || 0;
    });

    const payload = categories.map((cat) => {
      const catName = cat["category name"] || cat.categoryName || cat.name || "";
      const catCode = cat["category code"] || cat.categoryCode || cat.code || "";
      const key = normalizeText(catName);
      const staffCount = cat.staffAssigned ?? staffMap[key] ?? 0;
      const ticketCount = cat.ticketsReceived ?? ticketMap[key] ?? 0;
      const createdAt =
        cat.createdAt ||
        (cat._id?.getTimestamp ? cat._id.getTimestamp() : undefined) ||
        null;

      return {
        id: cat._id?.toString() || "",
        code: catCode,
        name: catName,
        date: createdAt,
        updatedAt: cat.updatedAt || createdAt || null,
        staffCount,
        tickets: ticketCount,
      };
    });

    res.json(payload);
  } catch (err) {
    console.error("Error fetching category summaries", err);
    res.status(500).json({ message: "Failed to load categories" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { code, name } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ message: "Category code and name are required" });
    }

    const existing = await CategoryModel.findOne({
      $or: [
        { "category code": code },
        { "category name": name },
      ],
    }).lean();

    if (existing?._id) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const doc = await CategoryModel.create({
      "category code": code,
      "category name": name,
      staffAssigned: 0,
      ticketsReceived: 0,
    });

    res.status(201).json({
      message: "Category created",
      category: {
        id: doc._id?.toString() || "",
        code: doc["category code"],
        name: doc["category name"],
        staffCount: doc.staffAssigned || 0,
        tickets: doc.ticketsReceived || 0,
        date: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error creating category", err);
    res.status(500).json({ message: "Failed to create category" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const doc = await CategoryModel.findOneAndUpdate(
      { _id: id, $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] },
      { $set: { deletedAt: now } },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ message: "Category deleted", deletedAt: now.toISOString() });
  } catch (err) {
    console.error("Error deleting category", err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body || {};

    if (!code || !name) {
      return res.status(400).json({ message: "Category code and name are required" });
    }

    const existing = await CategoryModel.findOne({
      _id: { $ne: id },
      $or: [{ "category code": code }, { "category name": name }],
    }).lean();

    if (existing?._id) {
      return res.status(409).json({ message: "Category with this code or name already exists" });
    }

    const updated = await CategoryModel.findByIdAndUpdate(
      id,
      {
        $set: {
          "category code": code,
          "category name": name,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({
      message: "Category updated",
      category: {
        id: updated._id?.toString() || "",
        code: updated["category code"] || "",
        name: updated["category name"] || "",
        date: updated.createdAt || null,
        updatedAt: updated.updatedAt || null,
        staffCount: updated.staffAssigned || 0,
        tickets: updated.ticketsReceived || 0,
      },
    });
  } catch (err) {
    console.error("Error updating category", err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

export { getCategories, getCategorySummaries, createCategory, updateCategory, deleteCategory };
