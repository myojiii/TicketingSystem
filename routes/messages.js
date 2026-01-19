import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";

const router = Router();

router.get("/api/tickets/:ticketId/messages", getMessages);
router.post("/api/tickets/:ticketId/messages", postMessage);

export default router;
