import { Router } from "express";
import { getMessages, postMessage, markTicketNotificationsRead } from "../controllers/messageController.js";

const router = Router();

router.get("/api/tickets/:ticketId/messages", getMessages);
router.post("/api/tickets/:ticketId/messages", postMessage);
router.patch("/api/notifications/ticket/:ticketId/read", markTicketNotificationsRead);

export default router;
