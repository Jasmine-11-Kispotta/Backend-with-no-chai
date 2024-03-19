import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";


const subscriptionRouter = Router()

subscriptionRouter.route("/toggleSubscription/:channelId").get(verifyJWT, toggleSubscription)

subscriptionRouter.route("/getUserChannelSubscribers/:channelId").get(verifyJWT, getUserChannelSubscribers)

subscriptionRouter.route("/getSubscribedChannels/:subscriberId").get(verifyJWT, getSubscribedChannels)


export {subscriptionRouter}