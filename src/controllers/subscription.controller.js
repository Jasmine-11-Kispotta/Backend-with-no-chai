import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";

const subscribe = asyncHandler(
    async(req, res) => {
          const user = await User.findById(req.user._id).select("-password -refreshToken")
          const channelName = req.body.channelName
        //   console.log(`user: ${user}`)
          const channelUser = await User.findOne({userName: channelName}).select("-password -refreshToken")
        //   console.log( `channwl: ${channelName}`)
        //   console.log(`channeluser: ${channelUser}`)
        //   console.log(`channeluser: ${channelUser._id}`)

          const subscriptionUserdata = await Subscription.create({
            subscriber : user._id,
            channel : channelUser._id,
          })

          res.status(200).json(
            new ApiResponse(200, {subscriptionUserdata}, "User successfully subscribed the channel")
          )
    }
)

const unSubscribe = asyncHandler(
    async(req, res) => {
        const channelName = req.body.channelName
        // console.log(`channelname: ${channelName}`)
        
        if(!channelName)
          throw ApiError(400, "channelName is missing")

        const channelUser = await User.findOne({userName: channelName}).select("-password -refreshToken")
       

        const objectFromSubscription = await Subscription.aggregate([
            {
                $match: {
                    subscriber: req.user._id,
                    channel: new mongoose.Types.ObjectId(channelUser._id)
                }
            }
        ])

        //deleting the object
        await Subscription.deleteOne({_id: objectFromSubscription[0]._id})

        res.status(200).json(
            new ApiResponse(200, {}, "user successfully unsubscribed the channel")
        )
    }
)

export {subscribe, unSubscribe}