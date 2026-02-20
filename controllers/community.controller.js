import db from "../models/index.js";
import sendResponse, { errorResponse } from "../utils/response.js";

const { Post, Auth, UserProfile, PostLike, Comment } = db;

/**
 * Get community feed (all posts)
 */
export const getFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const posts = await Post.findAll({
      include: [
        {
          model: Auth,
          as: "author",
          attributes: ["id", "name"],
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["photo", "city"],
            },
          ],
        },
        {
          model: PostLike,
          as: "likes",
          where: { userId: currentUserId },
          required: false,
          attributes: ["id"], 
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      location: post.location || post.author?.profile?.city || "Unknown",
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isLiked: post.likes && post.likes.length > 0,
      createdAt: post.createdAt,
      author: {
        id: post.author?.id,
        name: post.author?.name,
        photo: post.author?.profile?.photo || null,
      },
    }));

    return sendResponse(res, true, 200, { posts: formattedPosts }, "Feed fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create a new post
 */
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption, location } = req.body;
    
    // We expect the image file to be handled by middleware (e.g. multer)
    // For now, let's assume req.file or req.body.imageUrl (if direct URL)
    // If using 'copy' of user flow where we used text input for simplicty previously:
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;

    if (!imageUrl) {
        return sendResponse(res, false, 400, {}, "Image is required");
    }

    const newPost = await Post.create({
      userId,
      imageUrl,
      caption,
      location,
    });

    return sendResponse(res, true, 201, { post: newPost }, "Post created successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update a post
 */
export const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { caption, location } = req.body;

    const post = await Post.findOne({ where: { id, userId } });

    if (!post) {
      return sendResponse(res, false, 404, {}, "Post not found or unauthorized");
    }

    // Update fields if provided
    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;
    
    // If a new image is uploaded, update it (optional)
    if (req.file) {
      post.imageUrl = `/uploads/${req.file.filename}`;
    }

    await post.save();

    return sendResponse(res, true, 200, { post }, "Post updated successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete a post
 */
export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const post = await Post.findOne({ where: { id, userId } });

    if (!post) {
      return sendResponse(res, false, 404, {}, "Post not found or unauthorized");
    }

    await post.destroy();

    return sendResponse(res, true, 200, {}, "Post deleted successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Toggle like on a post
 */
export const toggleLikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Post ID

    const post = await Post.findByPk(id);
    if (!post) {
      return sendResponse(res, false, 404, {}, "Post not found");
    }

    const existingLike = await PostLike.findOne({
      where: { postId: id, userId },
    });

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      await post.decrement("likesCount");
      isLiked = false;
    } else {
      // Like
      await PostLike.create({ postId: id, userId });
      await post.increment("likesCount");
      isLiked = true;
    }

    // specific return for updated counts
    const updatedPost = await Post.findByPk(id);

    return sendResponse(
      res,
      true,
      200,
      { isLiked, likesCount: updatedPost.likesCount },
      isLiked ? "Post liked" : "Post unliked"
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Post ID
    const { content } = req.body;

    if (!content) {
      return sendResponse(res, false, 400, {}, "Comment content is required");
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return sendResponse(res, false, 404, {}, "Post not found");
    }

    const comment = await Comment.create({
      postId: id,
      userId,
      content,
    });

    await post.increment("commentsCount");

    // Fetch comment with author details to return
    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
            model: Auth,
            as: "author",
            attributes: ["id", "name"],
            include: [{ model: UserProfile, as: "profile", attributes: ["photo"] }]
        }
      ]
    });

    const formattedComment = {
        id: fullComment.id,
        content: fullComment.content,
        createdAt: fullComment.createdAt,
        author: {
            id: fullComment.author?.id,
            name: fullComment.author?.name,
            photo: fullComment.author?.profile?.photo
        }
    };

    return sendResponse(res, true, 201, { comment: formattedComment }, "Comment added successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get comments for a post
 */
export const getComments = async (req, res) => {
  try {
    const { id } = req.params; // Post ID

    const comments = await Comment.findAll({
      where: { postId: id },
      include: [
        {
          model: Auth,
          as: "author",
          attributes: ["id", "name"],
          include: [{ model: UserProfile, as: "profile", attributes: ["photo"] }],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const formattedComments = comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: {
            id: c.author?.id,
            name: c.author?.name,
            photo: c.author?.profile?.photo
        }
    }));

    return sendResponse(res, true, 200, { comments: formattedComments }, "Comments fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
