import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";


const toggleSubscription = asyncHandler(
  async(req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if(!channelId || !req.user._id)
          throw new ApiError(400, "channelId or userId is missing")
    console.log(`channelid: ${channelId}, userid: ${userId}`)
    
    const channel = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(channelId)
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $addFields: {
          isSubscribed: {
            $cond: {
              if: {$in: [req.user?._id, {$ifNull: ["$subscribers.subscriber", []]} ]},
              then: true,
              else: false
            }
          }
        }
      }
    ])

    console.log(channel[0])

    const subscribe = async() => {
      
      const subscriptionUserdata = await Subscription.create({
          subscriber : userId,
          channel : channelId,
      })

      return  res.status(200).json(
          new ApiResponse(200, {subscriptionUserdata}, "User successfully subscribed the channel")
      )
    
    }
    

    const unSubscribe = async() => {

      const objectFromSubscription = await Subscription.aggregate([
          {
              $match: {
                  subscriber: req.user._id,
                  channel: new mongoose.Types.ObjectId(channelId)
              }
          }
      ])

      if(!objectFromSubscription[0])
        throw new ApiError(500, "cannot retrieve data fom subscription")

      //deleting the object
      await Subscription.deleteOne({_id: objectFromSubscription[0]._id})

      return  res.status(200).json(
          new ApiResponse(200, {}, "user successfully unsubscribed the channel")
      )
    }
    
    channel[0].isSubscribed ? unSubscribe() : subscribe()
  }
)


const getUserChannelSubscribers = asyncHandler(
  async(req, res) => {
       const {channelId} = req.params

       const channelSubcribers = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(channelId)
          }
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
          }
        },
        {
          $project: {
            subscribers: 1
          }
        }
      ])

      res.status(200).json(
        new ApiResponse(200, {channelSubcribers}, "subscribers fetched successfully")
      )
  }
)

const getSubscribedChannels = asyncHandler(
  async(req, res) => {
       const {subscriberId} = req.params

       console.log(`subscriberId: ${subscriberId}`)

       const channelsSubscribed = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(subscriberId)
          }
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "channels"
          }
        },
        {
          $project: {
            channels: 1
          }
        }
      ])

      // console.log(channelsSubscribed)

      res.status(200).json(
        new ApiResponse(200, {channelsSubscribed}, "subscribers fetched successfully")
      )
  }
)

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}