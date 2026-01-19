import { Router } from "express";
import { getCategories, getCategorySummaries, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";

const router = Router();

router.get("/api/categories", getCategories);
router.get("/api/management/categories", getCategorySummaries);
router.post("/api/management/categories", createCategory);
router.put("/api/management/categories/:id", updateCategory);
router.delete("/api/management/categories/:id", deleteCategory);

export default router;
