import { Router } from "express";
import { getUserByEmail, getUserById } from "../controllers/authController.js";
import { listUsers, getClientSummaries, getStaffSummaries, createStaff } from "../controllers/userController.js";

const router = Router();

router.get("/getUsers", listUsers);
router.get("/api/users/by-email", getUserByEmail);
router.get("/api/users/id/:id", getUserById);
router.get("/api/management/users", getClientSummaries);
router.get("/api/management/staff", getStaffSummaries);
router.post("/api/management/staff", createStaff);

export default router;
