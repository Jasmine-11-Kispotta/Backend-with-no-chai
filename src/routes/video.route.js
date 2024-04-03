import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { uploadAVideo, getVideoById, updateVideoDetails, deleteVideo, togglePublishStatus, getAllVideos } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const videoRouter = Router()

videoRouter.route("/uploadAVideo").post(upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), verifyJWT, uploadAVideo)

videoRouter.route("/getVideoById").get(verifyJWT, getVideoById)

videoRouter.route("/updateVideoDetails").post(upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    }
]), verifyJWT, updateVideoDetails)

videoRouter.route("/deleteVideo").post(verifyJWT, deleteVideo)

videoRouter.route("/togglePublishStatus").post(verifyJWT, togglePublishStatus)

videoRouter.route("/getAllVideos").post(getAllVideos)

export {videoRouter}