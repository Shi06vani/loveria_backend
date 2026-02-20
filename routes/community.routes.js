import { Router } from "express";
import { 
    getFeed, 
    createPost, 
    updatePost, 
    deletePost,
    toggleLikePost,
    addComment,
    getComments
} from "../controllers/community.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

router.use(authenticate);

// Get main feed
router.get("/feed", getFeed);

// Create a post
router.post("/post", upload.single("image"), createPost);

// Update a post
router.put("/post/:id", upload.single("image"), updatePost);

// Delete a post
router.delete("/post/:id", deletePost);

// Like/Unlike a post
router.post("/post/:id/like", toggleLikePost);

// Add a comment
router.post("/post/:id/comment", addComment);

// Get comments
router.get("/post/:id/comments", getComments);

export default router;
