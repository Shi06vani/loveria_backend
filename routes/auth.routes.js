import { Router } from "express";
import { signup, login, forgotPassword, resetPassword, googleLogin } from "../controllers/auth.controller.js";
import validate from "../middlewares/validation.middleware.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleLoginSchema } from "../validations/auth.validation.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleLoginSchema), googleLogin);
router.post("/forgotpassword", validate(forgotPasswordSchema), forgotPassword);
router.put("/resetpassword", validate(resetPasswordSchema), resetPassword);

export default router;
