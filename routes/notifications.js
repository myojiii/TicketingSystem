import express from "express";
import {
  getNotifications,
  getNewNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notifications.js";

const router = express.Router();

router.get("/api/staff/:staffId/notifications", getNotifications);
router.get("/api/staff/:staffId/notifications/new", getNewNotifications);
router.patch("/api/notifications/:id/read", markAsRead);
router.patch("/api/staff/:staffId/notifications/read-all", markAllAsRead);
router.delete("/api/notifications/:id", deleteNotification);

export default router;