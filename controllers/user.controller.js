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
