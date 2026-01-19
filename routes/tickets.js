import { Router } from "express";
import {
  getTickets,
  getTicketsByUser,
  getStaffTickets,
  createTicket,
  updateCategory,
  updateTicket,
  deleteTicket,
  getTicket,
} from "../controllers/ticketController.js";

const router = Router();

router.get("/api/tickets", getTickets);
router.get("/api/staff/:staffId/tickets", getStaffTickets);
router.get("/api/tickets/user/:userId", getTicketsByUser);
router.post("/api/tickets", createTicket);
router.put("/api/tickets/:id/category", updateCategory);
router.put("/api/tickets/:id", updateTicket);
router.delete("/api/tickets/:id", deleteTicket);
router.get("/api/tickets/:id", getTicket);

export default router;
