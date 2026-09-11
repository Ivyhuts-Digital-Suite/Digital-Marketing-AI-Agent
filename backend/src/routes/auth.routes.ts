import { Router } from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

console.log("Auth routes loaded");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getCurrentUser);

export default router;