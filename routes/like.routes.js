import { Router } from "express";
import { getLikes, sendLike } from "../controllers/like.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Get list of people who liked the logged-in user
router.get("/received", getLikes);

// Send a like to someone
router.post("/send", sendLike);

export default router;
