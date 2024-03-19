import { Router } from "express";
import {loginUser, logoutUser, refreshAccessToken, registerUser, changeCurrentPassword, getCurretUser, updateUserDetails, updateAvatarOrCoverImage, getuserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
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

router.route("/updateUserDetails").patch(verifyJWT, updateUserDetails)     
//The PATCH method in HTTP is used to apply partial modifications to a resource. It updates only the fields or properties that are included in the request payload, leaving the rest of the resource unchanged.

router.route("/updateAvatarOrCoverImage").patch(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), verifyJWT, updateAvatarOrCoverImage)


router.route("/getUserChannelProfile/:userName").get(verifyJWT, getuserChannelProfile)

router.route("/getWatchHistory").get(verifyJWT, getWatchHistory)



export default router