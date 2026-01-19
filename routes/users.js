import { Router } from "express";
import { getUserByEmail, getUserById } from "../controllers/authController.js";
import { listUsers } from "../controllers/userController.js";

const router = Router();

router.get("/getUsers", listUsers);
router.get("/api/users/by-email", getUserByEmail);
router.get("/api/users/id/:id", getUserById);

export default router;
