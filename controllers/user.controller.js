import db from "../models/index.js";
import sendResponse, { errorResponse } from "../utils/response.js";
import fs from "fs";

const { UserProfile, Auth } = db;

/**
 * Get User Profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await UserProfile.findOne({
      where: { userId },
      include: [
        {
          model: Auth,
          as: "user",
          attributes: ["id", "name", "email", "contact"],
        },
      ],
    });

    if (!profile) {
      // Return basic user info even if profile doesn't exist yet
      return sendResponse(res, true, 200, {
          user: req.user,
          profile: null
      }, "Profile not found, please complete your profile");
    }

    return sendResponse(res, true, 200, profile, "Profile fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update (or Create) User Profile
 * Handles multipart/form-data
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { city, interests, relationshipGoal } = req.body;
    let photoUrl = null;

    if (req.file) {
      // Normalize path separator to forward slash for URLs
      photoUrl = req.file.path.replace(/\\/g, "/");
    }

    // Check if profile exists
    let profile = await UserProfile.findOne({ where: { userId } });

    // Delete old photo if new one is uploaded
    if (photoUrl && profile && profile.photo) {
      const oldPhotoPath = profile.photo;
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    let parsedInterests = [];
    if (interests) {
        try {
            parsedInterests = typeof interests === 'string' ? JSON.parse(interests) : interests;
        } catch (e) {
            // Fallback: if it's a simple string, make it an array, otherwise keep empty
            parsedInterests = [interests.toString()];
        }
    }

    const updateData = {
      ...(city && { city }),
      ...(interests && { interests: parsedInterests }),
      ...(relationshipGoal && { relationshipGoal }),
      ...(photoUrl && { photo: photoUrl }),
    };

    if (profile) {
      // Update existing
      profile = await profile.update(updateData);
    } else {
      // Create new
      profile = await UserProfile.create({
        userId,
        ...updateData,
      });
    }

    return sendResponse(
      res,
      true,
      200,
      profile,
      "Profile updated successfully"
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get Recommendations (for Home Screen Swipe)
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // fetch profile of all users except the current one
    const users = await UserProfile.findAll({
      where: {
        userId: {
          [db.Sequelize.Op.ne]: userId
        }
      },
      include: [
        {
          model: Auth,
          as: "user",
          attributes: ["id", "name", "email", "contact"],
        },
      ],
      limit: 20,
    });

    // Map to frontend expectations
    const mappedUsers = users.map(u => ({
      id: u.userId,
      name: u.user?.name || "Unknown",
      age: 22, // Fallback since DB has no age
      bio: u.relationshipGoal || u.city || "Looking for someone special",
      image: u.photo ? `${process.env.BASE_URL || "http://10.0.2.2:5000"}/${u.photo}`.replace(/([^:]\/)\/+/g, "$1") : "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    }));

    return sendResponse(res, true, 200, mappedUsers, "Recommendations fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get Public User Profile by ID
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await UserProfile.findOne({
      where: { userId: id },
      include: [
        {
          model: Auth,
          as: "user",
          attributes: ["id", "name", "email", "contact"],
        },
      ],
    });

    if (!profile) {
      return errorResponse(res, "User profile not found", 404);
    }

    // Map to the same format the frontend expects for cards
    const mappedUser = {
      id: profile.userId,
      name: profile.user?.name || "Unknown",
      age: 22, // Fallback
      bio: profile.relationshipGoal || "Looking for someone special",
      city: profile.city || "Nearby",
      interests: profile.interests || [],
      photo: profile.photo ? profile.photo : null,
      image: profile.photo ? `${process.env.BASE_URL || "http://10.0.2.2:5000"}/${profile.photo}`.replace(/([^:]\/)\/+/g, "$1") : null,
    };

    return sendResponse(res, true, 200, mappedUser, "User profile fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
