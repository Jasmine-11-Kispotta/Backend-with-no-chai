import { Router } from "express";
import {loginUser, logoutUser, refreshAccessToken, registerUser, changeCurrentPassword, getCurretUser, updateUserDetails, updateAvatarOrCoverImage} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router()
//injected multer middleware just before the method to be executed for response
//middleware adds more fields to req.body
router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refreshAccessToken").post(refreshAccessToken)

router.route("/changeCurrentPassword").post(verifyJWT, changeCurrentPassword)

router.route("/getCurrentUser").post(verifyJWT, getCurretUser)

router.route("/updateUserDetails").post(verifyJWT, updateUserDetails)

router.route("/updateAvatarOrCoverImage").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), verifyJWT, updateAvatarOrCoverImage)
export default router