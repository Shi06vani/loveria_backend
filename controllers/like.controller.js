import db from "../models/index.js";
import sendResponse, { errorResponse } from "../utils/response.js";
import { Op } from "sequelize";

const { Like, Auth, UserProfile } = db;

/**
 * Get users who liked me
 * (For the "Likes You" screen)
 */
export const getLikes = async (req, res) => {
  try {
    const userId = req.user.id; // Logged in user

    // 1. Get IDs of users I have already rejected
    const rejectedInteractions = await Like.findAll({
      where: {
        senderId: userId,
        status: "rejected",
      },
      attributes: ["receiverId"],
    });

    const rejectedUserIds = rejectedInteractions.map((like) => like.receiverId);

    // 2. Get likes received from users I haven't rejected
    const likes = await Like.findAll({
      where: {
        receiverId: userId,
        status: "pending", // Only show pending likes (not yet matched)
        senderId: {
          [Op.notIn]: rejectedUserIds, // Exclude rejected users
        },
      },
      include: [
        {
          model: Auth,
          as: "sender",
          attributes: ["id", "name"], // Minimal user info
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["photo", "city"], // Info needed for the card
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format the response to match the UI needs
    const formattedLikes = likes.map((like) => {
      const sender = like.sender;
      // Calculate age if DOB existed, but for now we'll just mock it or skip it
      // as we don't have DOB in current schema. We'll send name and photo.
      return {
        likeId: like.id,
        userId: sender.id,
        name: sender.name,
        photo: sender.profile?.photo || null,
        city: sender.profile?.city || null,
        likedAt: like.createdAt,
      };
    });

    // Check premium status
    const activeSubscription = await db.Subscription.findOne({
      where: {
        userId,
        status: "active",
        endDate: { [Op.gt]: new Date() },
      },
    });
    const isPremium = !!activeSubscription;

    // We can also return a count or let the frontend enable/disable blur
    // based on premium status
    return sendResponse(res, true, 200, {
      count: formattedLikes.length,
      likes: formattedLikes,
      isPremium,
    }, "Likes fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Send a like to someone
 */
export const sendLike = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const senderId = req.user.id;
    const { receiverId, action = "like" } = req.body;

    // 1. Strict Validation
    if (!["like", "dislike"].includes(action)) {
      await t.rollback();
      return sendResponse(res, false, 400, {}, "Invalid action. Must be 'like' or 'dislike'.");
    }

    if (senderId === receiverId) {
      await t.rollback();
      return sendResponse(res, false, 400, {}, "You cannot interact with yourself");
    }

    // 2. Find existing interaction (sender -> receiver)
    // We will UPSERT: update success if exists, create if not
    let currentInteraction = await Like.findOne({
      where: { senderId, receiverId },
      transaction: t,
    });

    const targetStatus = action === "dislike" ? "rejected" : "pending";

    // 3. Handle Update logic (If exists)
    if (currentInteraction) {
      // If no status change, just return success (Idempotent)
      if (currentInteraction.status === targetStatus || 
          (action === 'like' && currentInteraction.status === 'matched')) {
        // If it's already matched and we send 'like', it remains matched
        await t.commit();
        return sendResponse(res, true, 200, { isMatch: currentInteraction.status === 'matched' }, action === 'like' ? "Already liked" : "Already disliked");
      }

      // If changing status (e.g. pending -> rejected, rejected -> pending, matched -> rejected)
      
      // CASE A: Changing from MATCHED/PENDING to REJECTED (Dislike)
      if (action === "dislike") {
        await currentInteraction.update({ status: "rejected" }, { transaction: t });

        // If it WAS matched, we need to break the match for the other person
        // Determine if we need to downgrade the OTHER person's status?
        // Usually if I reject match, their status effectively becomes "pending" (they liked me, I rejected them)
        // OR we just leave them 'matched' but since I rejected, the match is broken? 
        // Better to reset them to 'pending' so they know the match is gone (or keep pending).
        await Like.update(
          { status: "pending" }, // Downgrade the other person to pending (since I rejected)
          { 
             where: { senderId: receiverId, receiverId: senderId, status: "matched" },
             transaction: t
          }
        );
        
        await t.commit();
        return sendResponse(res, true, 200, { isMatch: false }, "User disliked successfully");
      }

      // CASE B: Changing from REJECTED to LIKE (Second chance)
      if (action === "like") {
        // Update my status to pending first
        await currentInteraction.update({ status: "pending" }, { transaction: t });
        // Proceed to check for match below...
      }
    } else {
      // 4. Create new interaction if none exists
      currentInteraction = await Like.create({
        senderId,
        receiverId,
        status: targetStatus,
      }, { transaction: t });

      if (action === "dislike") {
          await t.commit();
          return sendResponse(res, true, 200, { isMatch: false }, "User disliked successfully");
      }
    }

    // 5. Check for Match (Only reachable if action is 'like' and we are now 'pending')
    // Check if the other person has liked me (pending matches)
    const reverseLike = await Like.findOne({
      where: {
        senderId: receiverId,
        receiverId: senderId,
        status: "pending",
      },
      transaction: t,
    });

    let isMatch = false;
    if (reverseLike) {
      isMatch = true;
      // Update BOTH interactions to 'matched' atomically
      await Like.update(
        { status: "matched" },
        {
          where: {
            [Op.or]: [
              { senderId: senderId, receiverId: receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          },
          transaction: t,
        }
      );
    }

    await t.commit();
    return sendResponse(res, true, 200, { isMatch }, "Like sent successfully");

  } catch (error) {
    try { await t.rollback(); } catch (e) { /* ignore rollback error */ }
    return errorResponse(res, error.message, 500);
  }
};
