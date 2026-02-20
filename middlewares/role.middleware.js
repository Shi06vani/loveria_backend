import { errorResponse } from "../utils/response";

/**
 * Role based access control
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, "Access denied", 403);
    }

    next();
  };
};
