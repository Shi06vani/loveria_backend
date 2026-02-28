import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  contact: Joi.string().pattern(/^[0-9]+$/).min(10).max(15).optional(), // Simple digit check
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required(),
});

export const googleLoginSchema = Joi.object({
  token: Joi.string().required(),
});
