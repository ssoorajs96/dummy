import { Router } from "express";
import {
    loginUser,
    refreshAccessToken,
    registerUser,
    updateUserAvatar
} from "../controllers/user.controllers.js";
import {
    userRegisterValidator,
    loginValidator
} from "../validators/user.validators.js";
import { validate } from "../validators/validate.js";
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Unsecured route
router.route("/refresh-token").post(refreshAccessToken);
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(loginValidator(), validate, loginUser);
router.route('/update-avatar').post(verifyJWT, upload.single("avatarImage"), updateUserAvatar)
export default router;
