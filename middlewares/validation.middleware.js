import { errorResponse } from "../utils/response.js";

/**
 * Common Joi validation middleware
 * @param {Object} schema - Joi schema
 * @param {String} property - body | query | params
 */
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: true,      // stop at first error
      stripUnknown: true,    // remove extra fields
    });

    if (error) {
      return errorResponse(
        res,
        error.details[0].message.replace(/"/g, ""),
        400
      );
    }

    // assign sanitized value back
    req[property] = value;
    next();
  };
};

export default validate;
