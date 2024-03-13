import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

//replacing res with '_' coz res is not getting used
const verifyJWT = asyncHandler(
    async(req, _, next) => {
       try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")    //it may happen that we get access token as cookies or as header
     
        if(!token){
         throw new ApiError(401, "Unauthorized request")
        }
 
       const VerifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)    //verfying that the token is jwt and is not tampered
       
       const user = await User.findById(VerifiedToken._id).select("-password -refreshToken")
       if(!user){
         throw new ApiError(401, "Invalid access token")
       }
      
       req.user = user  //giving the access of user object to req.user
       next()
       } catch (error) {
         throw new ApiError(401, error)
       }
    }
)

export default verifyJWT