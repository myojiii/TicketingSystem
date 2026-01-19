import { Router } from "express";
import { getCategories, getCategorySummaries, createCategory } from "../controllers/categoryController.js";

const router = Router();

router.get("/api/categories", getCategories);
router.get("/api/management/categories", getCategorySummaries);
router.post("/api/management/categories", createCategory);

export default router;
