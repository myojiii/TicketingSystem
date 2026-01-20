import { Router } from "express";
import {
  getTicketsPerCategory,
  getResolutionTimeAnalysis,
  getTicketVolumeTrends,
  exportReportData,
  getFilterOptions,
} from "../controllers/reportsController.js";

const router = Router();

// Report endpoints
router.get("/api/reports/category", getTicketsPerCategory);
router.get("/api/reports/resolution", getResolutionTimeAnalysis);
router.get("/api/reports/trends", getTicketVolumeTrends);
router.get("/api/reports/export", exportReportData);
router.get("/api/reports/filters", getFilterOptions);

export default router;