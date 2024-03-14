import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type: Schema.Types.ObjectId,   //the user who is subscribing a channel
        ref: "User"
    },
    channel : {
        type: Schema.Types.ObjectId,  //another user to whom the user is subscribing
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)