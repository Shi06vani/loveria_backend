import express from "express";
import { 
    sendMessage, 
    getMessages, 
    getConversations,
    deleteConversation,
    deleteMessage,
    updateMessage
} from "../controllers/chat.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

router.post("/send", authenticate, sendMessage);
router.get("/conversations", authenticate, getConversations);
router.get("/:userId", authenticate, getMessages);

router.delete("/conversation/:targetUserId", authenticate, deleteConversation);
router.delete("/message/:messageId", authenticate, deleteMessage);
router.put("/message/:messageId", authenticate, updateMessage);

export default router;
