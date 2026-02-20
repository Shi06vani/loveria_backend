import { Router } from "express";
import { 
    updateCityFilter, 
    updatePrivacy, 
    blockUser, 
    unblockUser, 
    getBlockedUsers 
} from "../controllers/settings.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Update City Filter
router.put("/filter-city", updateCityFilter);

// Update Privacy
router.put("/privacy", updatePrivacy);

// Block Management
router.get("/blocked-users", getBlockedUsers);
router.post("/block", blockUser);
router.post("/unblock", unblockUser);

export default router;
