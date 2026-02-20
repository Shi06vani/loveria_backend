import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { errorResponse } from "../utils/response.js";

const { Auth } = db;

/**
 * Authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check token presence
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Authorization token required", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await Auth.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return errorResponse(res, "Invalid or expired token", 401);
    }

    if (!user.is_active) {
      return errorResponse(res, "User account is inactive", 403);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, "Token expired", 401);
    }

    return errorResponse(res, "Unauthorized access", 401);
  }
};
