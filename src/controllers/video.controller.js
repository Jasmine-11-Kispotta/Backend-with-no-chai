import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFileOfCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { getViewsAndDurationofVideo } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const uploadAVideo = asyncHandler(
    async(req, res) =>{
          const {title, description} = req.body
          
          if(!title){
            throw new ApiError("400", "title of video is required!")
          }

          const videoLocalPath = req.files?.video?.[0].path
          const thumbnailLocalPath = req.files?.thumbnail?.[0].path

          if(!videoLocalPath || !thumbnailLocalPath)
            throw new ApiError(400, "video and thumbnail is required")

          const videoPath = await uploadOnCloudinary(videoLocalPath)
          const thumbnailPath = await uploadOnCloudinary(thumbnailLocalPath)

          if (!videoPath || !thumbnailPath)
            throw new ApiError(500, "error while uploading")
        
          const user = await User.findById(req.user._id).select("-password -refreshToken")

          const {views, duration} = getViewsAndDurationofVideo(videoPath.url)
          console.log(`here+ ${user}`)
          const createVideoObject = Video.create(
            {
                videoFile: videoPath.url,
                thumbnail: thumbnailPath.url,
                owner: user._id,
                title: title,
                description: description || "",
                duration:duration,
                views: views,
                isPublished: false
            }
          )
          
          console.log(createVideoObject._id)
          const createdVideoObj = await Video.findById(createVideoObject._id)
          if(!createdVideoObj){
            throw new ApiError(500, "something went wrong while uploading files")
          }

          return res.status(200).json(
            new ApiResponse(200, {createdVideoObj}, "uploaded video by user successfully")
          )
    }
)

const getVideoById = asyncHandler(
  async(req, res) =>{
    const {videoId} = req.params

    const foundVideo = await Video.findById(videoId)

    if(!foundVideo){
      throw new ApiError(500, "video doesn't exist!")
    }

    return res.status(200).json(
      new ApiResponse(200, {foundVideo}, "successfully fetched the video")
    )
  }
)

const updateVideoDetails = asyncHandler(
  async(req, res) => {
    const {videoId, title, description} = req.params

    const newThumbnailLocalPath = req.files?.[0]?.thumbnail

    const newThumbnailPath = await uploadOnCloudinary(newThumbnailLocalPath)

    if(!newThumbnailPath)
      throw new ApiError(500, "error while uploading new thumbnail")

    const oldThumbNail = await Video.findById(videoId).select("thumbnail")
    if(!oldThumbNail)
      console.log(`"error while retrieving old thumbnail - ${oldThumbNail}"`)

    const foundVideo = await Video.findByIdAndUpdate(videoId, {
      $set : {
        title: title,
        description,
        thumbnail: newThumbnailPath
      }
    },
    {
      new : true
    })

    console.log(`${foundVideo}`)
    if(!foundVideo)
      throw new ApiError(500, "something went wrong")
    
    deleteFileOfCloudinary(oldThumbNail)

    return res.status(200).json(
      new ApiResponse(200, {foundVideo}, "successfully updated video details")
    )

  }
)


const deleteVideo = asyncHandler(
  async(req, res) => {
      const {videoId} = req.params

      const videoFound = await Video.findById(videoId)

      const videoUrl = videoFound.videoFile

      deleteFileOfCloudinary(videoUrl)

      await Video.findByIdAndDelete(videoId)

      return res.status(200).json(
        new ApiResponse(200, "successfully deleted video")
      )
  }
)

const togglePublishStatus = asyncHandler(
  async(req, res) => {
    const {videoId} = req.params

    const videoFound = await Video.findById(videoId)

    if(videoFound.isPublished)
        videoFound.isPublished = false
    else
        videoFound.isPublished = true

    return res.status(200).json(
      new ApiResponse(200, {videoFound}, "successfully toggled publish status")
    )

  }
)


const getAllVideos = asyncHandler(
  async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const videosBasedOnQuery = await Video.aggregate([
      {
        $match : {
          title: query
        }
      }
    ])

    const paginatedVideos = await Video.aggregatePaginate(videosBasedOnQuery, {page, limit}, (err, results) => {
      if(err)
        console.log(err)
      else
        console.log(results)
    })

    return res.status(200).json(
      new ApiResponse(200, {paginatedVideos}, "successfully got the videos")
    )
  }
)


export {uploadAVideo, getVideoById, updateVideoDetails, deleteVideo, togglePublishStatus, getAllVideos}