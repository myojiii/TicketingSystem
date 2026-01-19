import { Router } from "express";
import { getUserByEmail, getUserById } from "../controllers/authController.js";
import { listUsers, getClientSummaries, getStaffSummaries, createStaff, updateStaff, deleteStaff } from "../controllers/userController.js";

const router = Router();

router.get("/getUsers", listUsers);
router.get("/api/users/by-email", getUserByEmail);
router.get("/api/users/id/:id", getUserById);
router.get("/api/management/users", getClientSummaries);
router.get("/api/management/staff", getStaffSummaries);
router.post("/api/management/staff", createStaff);
router.put("/api/management/staff/:id", updateStaff);
router.delete("/api/management/staff/:id", deleteStaff);

export default router;
