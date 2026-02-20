import { Router } from "express";
import { getPlans, subscribeUser, getSubscription } from "../controllers/premium.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Get available plans
router.get("/plans", getPlans);

// Get current subscription only
router.get("/my-subscription", getSubscription);

// Subscribe to a plan
router.post("/subscribe", subscribeUser);

export default router;
