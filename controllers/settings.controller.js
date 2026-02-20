import db from "../models/index.js";
import sendResponse, { errorResponse } from "../utils/response.js";

const { UserProfile, BlockedUser, Auth } = db;

/**
 * Update City Filter
 */
export const updateCityFilter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { city } = req.body; // New filter city

    let profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return sendResponse(res, false, 404, {}, "Profile not found");
    }

    profile.filterCity = city;
    await profile.save();

    return sendResponse(res, true, 200, { filterCity: profile.filterCity }, "City filter updated");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update Privacy Settings
 */
export const updatePrivacy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isProfileVisible } = req.body;

    let profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return sendResponse(res, false, 404, {}, "Profile not found");
    }

    // Ensure it's boolean
    if (isProfileVisible !== undefined) {
        profile.isProfileVisible = isProfileVisible;
        await profile.save();
    }

    return sendResponse(res, true, 200, { isProfileVisible: profile.isProfileVisible }, "Privacy settings updated");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Block a user
 */
export const blockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockedId } = req.body;

    if (!blockedId) {
      return sendResponse(res, false, 400, {}, "User ID to block is required");
    }

    if (userId === blockedId) {
        return sendResponse(res, false, 400, {}, "You cannot block yourself");
    }

    // Check if valid user
    const userToBlock = await Auth.findByPk(blockedId);
    if (!userToBlock) {
        return sendResponse(res, false, 404, {}, "User to block not found");
    }

    // Check if already blocked
    const existingBlock = await BlockedUser.findOne({
      where: { blockerId: userId, blockedId },
    });

    if (existingBlock) {
      return sendResponse(res, false, 400, {}, "User is already blocked");
    }

    await BlockedUser.create({
      blockerId: userId,
      blockedId,
    });

    return sendResponse(res, true, 200, {}, "User blocked successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockedId } = req.body;

    const blockEntry = await BlockedUser.findOne({
      where: { blockerId: userId, blockedId },
    });

    if (!blockEntry) {
      return sendResponse(res, false, 404, {}, "Block record not found");
    }

    await blockEntry.destroy();

    return sendResponse(res, true, 200, {}, "User unblocked successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all blocked users
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const blockedUsers = await BlockedUser.findAll({
      where: { blockerId: userId },
      include: [
        {
          model: Auth,
          as: "blockedUser",
          attributes: ["id", "name"],
          include: [
              { // Assuming you might want their photo too if Auth -> UserProfile logic allows, 
                // but Auth associations in models/index.js link Auth to Profile.
                // We need to check if Auth has association 'profile' available here.
                // In models/index.js: db.Auth.hasOne(db.UserProfile, { as: "profile" })
                model: UserProfile,
                as: "profile",
                attributes: ["photo"]
              }
          ]
        },
      ],
    });

    const formattedList = blockedUsers.map(b => ({
        blockedId: b.blockedUser.id,
        name: b.blockedUser.name,
        photo: b.blockedUser.profile?.photo || null,
        blockedAt: b.createdAt
    }));

    return sendResponse(res, true, 200, { blockedUsers: formattedList }, "Blocked users fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
