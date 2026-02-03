import { Router } from "express";
import { getUserByEmail, getUserById } from "../controllers/authController.js";
import { listUsers, getClientSummaries, getStaffSummaries, createStaff, updateStaff, deleteStaff } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/getUsers", requireRole("admin"), listUsers);
router.get("/api/users/by-email", requireAuth, getUserByEmail);
router.get("/api/users/id/:id", requireAuth, getUserById);
router.get("/api/management/users", requireRole("admin"), getClientSummaries);
router.get("/api/management/staff", requireRole("admin"), getStaffSummaries);
router.post("/api/management/staff", requireRole("admin"), createStaff);
router.put("/api/management/staff/:id", requireRole("admin"), updateStaff);
router.delete("/api/management/staff/:id", requireRole("admin"), deleteStaff);

export default router;
