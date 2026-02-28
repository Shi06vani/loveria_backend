import { Router } from "express";
import { signup, login, forgotPassword, verifyOtp, resetPassword, googleLogin } from "../controllers/auth.controller.js";
import validate from "../middlewares/validation.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { signupSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema, googleLoginSchema } from "../validations/auth.validation.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleLoginSchema), googleLogin);
router.post("/forgotpassword", validate(forgotPasswordSchema), forgotPassword);
router.post("/verifyotp", validate(verifyOtpSchema), verifyOtp);
router.put("/resetpassword", authenticate, validate(resetPasswordSchema), resetPassword);

export default router;
