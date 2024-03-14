import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const refreshToken = user.genrateRefreshToken()
        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})   // the validateBeforeSave option is used to control whether or not Mongoose should perform validation on a document(checking of all the fields) before saving it to the database.
    
        return {accessToken, refreshToken}
    
    } catch (error) {
      throw new ApiError(500, "error while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    //get user details from frontend
    //validation - check if details are empty 
    //check if user already exists - email, username
    //check for images and avatar
    //upload them to cloudinary
    //getting url of image or avatar from cloudinary
    //create user object - create entry in db (storing images in MongoDB)
    //for the response, we will give the entire user object, but removing password and refresh token field
    //check for user creation - if we will get the user object, it means user is created
    //return response to user

    const {email, fullName, userName, password} = req.body
    console.log(`email: ${email}, username: ${userName}, password: ${password}, fullNAme: ${fullName}`)
    // res.send("Congratulations Cynia")
   

    //checking if any field is empty
    // using if statement for each field separately is also good for beginners
    //Optional chaining operator(?.) helps to avoid errors that would typically occur when trying to access properties or methods on an object that is null or undefined. It avoids showing error.
    if(
        [email, fullName, userName, password].some((field) => field?.trim() === "")  //trim() method is used on strings to remove whitespace characters from both ends of the string.
    ){
         throw new ApiError(400, "Required username, email, fullname and passsword")
    }

    //checking if user already exists
    const userExist = await User.findOne({
        $or: [{userName}, {email}]
    })

    if (userExist){
        throw new ApiError(409, "User with username or email already exists!")
    }
    

    //multer middleware adds more fields to req.body. It gives the access of files coming with requests
    const avatarLocalPath = req.files?.avatar?.[0]?.path //got the local path of the avatar image stored in disk by multer
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    

    console.log(avatarLocalPath)
    if(!avatarLocalPath){ //if avataLocalPath has undefined or null value, it equals false which then turns into true by ! operator
        throw new ApiError(400, "Avatar is required")
    }
    // else{
    //    await uploadOnCloudinary(avatarLocalPath)
    // }
    const avatar = await uploadOnCloudinary(avatarLocalPath) //uploading on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){ //double checking that avatar image path is there, whether it is successfully uploaded in cloudinary
        throw new ApiError(400, "avatar is required")    
    }


    //creating user object following the userSchema and passing values to be stored in MongoDB
    const user = await User.create({
        userName: userName.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })

    //checking that the 'user' object is created in db or not, by finding it using its id (user._id)
    //every object created in db is assigned a '_id' by default by mongoDB 
    //after finding it the 'createdUser' object now contains all the fields inside the object 'user'
    //The select() method selects all the fields of 'user' object.
    //So now for giving response to my main User, unselecting the fields which i don't want to show to my user(i.e.passwords, refreshToken)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //now checking that 'createdUser' object has some value, if yes then 'user' object is successfully created in db
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    //now send the response to main user
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler( async(req, res) => {
   //trigger when somewhen hit /api/v1/users/login
   //take input - username or email, password from req.body
   //checking if the username or email exists 
   //if username exists -> check password -> if password matched - provide access and refersh tokens to users as cookies, return "successfully loggegd in ", if password doesn't matched - return "incorrect password" 
   //if username doesn't exist - return "incorrect username"

//    console.log(req.body)
   const {email, userName, password} = req.body   //taking data from req.body
   
   console.log(`${email}, ${userName}, ${password}`)
   if(!email && !userName){                       //if email and username both is not there
       throw new ApiError(400, "email or username is required!")
   }
   
   const user = await User.findOne({                   //finding the user with their email or username
    $or: [{userName}, {email}]
   }
   )

   if(!user){                                    //if the user with the given username or email does not exist
    throw new ApiError(404, "user doesn't exist")
   }
   
   const isPasswordCorrect = await user.isPasswordCorrect(password)    //if the user with the given username or email exists then check if password is matching
   if(!isPasswordCorrect){                                             //if password does not match
    throw new ApiError(404, "incorrect password")
   }
   
   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)       //if password matches generate access and refresh tokens

   const loggegdInUser = await User.findById(user._id).select("-password -refreshToken")        //unselecting the fields we don't want to show from user object

   //need to send tokens as cookies
   //for cookies we need to set some options 
   const options = {
    httpOnly: true,        //this option forbids frontend to modify the cookies
    secure: true
   }

   return res.status(200)
             .cookie("accessToken", accessToken, options)
             .cookie("refreshToken", refreshToken, options)
             .json(
                new ApiResponse(200, 
                               {user: loggegdInUser, 
                                refreshToken: refreshToken, 
                                accessToken: accessToken},
                                 "Suuccessfully logged in")
             )
  
})

const logoutUser = asyncHandler(
    async(req, res) => {
        const customer = await User.findByIdAndUpdate(req.user._id,
            { 
              $set: {refreshToken: ""}
            },
            {
                new: true        //returns new updated object as response
            }
        )
        const customer1 = await User.findById(req.user._id).select("-password -refreshToken")
        console.log(customer1._id)
        const options = {
            httpOnly: true,        //this option forbids frontend to modify the cookies
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {customer1}, "User logged out"))
    }
)

const refreshAccessToken = asyncHandler(
    async(req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(400, "Unauthorized request")
        }
        
        try {
            const verifiedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
            const user = await User.findById(verifiedRefreshToken._id).select('-password')
    
            if(!user){
                throw new ApiError(400, "invalid refresh token")
            }
    
            if(incomingRefreshToken !== user?.refreshToken){
                throw new ApiError(400, "refresh token is expired or used")
            }
            
            const newTokens = await generateAccessAndRefreshTokens(user._id)
    
            const options = {
                httpOnly: true,        //this option forbids frontend to modify the cookies
                secure: true
            }
    
            res.status(200)
               .cookie("accessToken", newTokens.accessToken, options)
               .cookie("refreshToken", newTokens.refreshToken, options)
               .json(
                new ApiResponse(200, {newTokens}, "Refreshed access token")
               )
    
        } catch (error) {
            throw new ApiError(401, error?.message || "invalid refresh token")
        }
    }
)

const changeCurrentPassword = asyncHandler(
    async(req, res) =>{
        const user = await User.findById(req.user?._id)
        console.log(user)
        const {oldPassword, newPassword} = req.body
        
        const passwordCorrect = await user.isPasswordCorrect(oldPassword)
        console.log(passwordCorrect)
        if(!passwordCorrect){
            throw new ApiError(400, "incorrect Password")
        }
        
        user.password = newPassword           //This change affects only the user object, not the original document in the database.
        const updatedUser = await user.save({validateBeforeSave: false})   //saving the user object will change the original document in the database because the user object represents the document retrieved from the database and has the same _id. 

        res.status(200).json(
            new ApiResponse(200, updatedUser, "password changed successfully")
        )
    }
)


const getCurretUser = asyncHandler(
    async (req, res) => {
       res.status(200).json(
        new ApiResponse(200, req.user, "fetched current user")
       )
    }
)

const updateUserDetails = asyncHandler(
    async(req, res) => {
        const {userName, fullName, email} = req.body

        if(!userName && !fullName && !email){
            throw new ApiError(400, "userName, fullname or email is required for updation!")
        }
        console.log(`${userName}, ${fullName}, ${email}`)
        
    
        //we can update and save details this way but coz we are not updating password, this code will trigger the pre save method, which is written for encryption of password before saving, which will also take some time
        //const user = await User.findById(req.user._id)
        // if(userName){
        //     user.userName = userName
        // } 
        // if(fullName)
        //     user.fullName = fullName

        // if(email)
        //     user.email = email
       
        // const updatedUser = await user.save({validateBeforeSave: true})

        console.log(`id = ${req.user}`)
        let updatedUser ={}
        console.log(`updateduser = ${updatedUser}`)
        if(userName && fullName && email){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
           {
             $set: {
                  userName: userName.toLowerCase(),
                  fullName: fullName,
                  email : email.toLowerCase()
                 }
           },
           {
            new: true
           }).select("-password -refreshToken")
        }
        else if(userName && email){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
                {
                $set: {
                 userName: userName,
                 email,
                  }
                },
                {
                 new: true
                }).select("-password -refreshToken")
        }
        else if(userName && fullName){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
                {
                $set: {
                       userName: userName,
                       fullName: fullName,
                      }
                },
                {
                 new: true
                }).select("-password -refreshToken")
        }
        else if(fullName && email){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
                {$set: {
                           fullName: fullName,
                           email
                       }
                },
                {
                    new: true
                }
            ).select("-password -refreshToken")
        }
        else if(fullName){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
                {$set: {
                           fullName: fullName
                       }
                },
                {
                    new: true
                }
            ).select("-password -refreshToken")
        }
        else if(email){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
                {$set: {
                           email
                       }
                },
                {
                    new: true
                }
            ).select("-password -refreshToken")
        }
        else if(userName){
            updatedUser = await User.findByIdAndUpdate(req.user?._id, 
                {$set: {
                          userName
                       }
                },
                {
                    new: true
                }
            ).select("-password -refreshToken")
        }
        else{
            throw new ApiError(500, "something went wrong")
        }


        res.status(200).json(
        new ApiResponse(200, updatedUser, "successfully updated user details")
    )
    }
)

const updateAvatarOrCoverImage = asyncHandler(
    async(req, res) =>{
         const {avatar, coverImage} = req.files
         if(!avatar && !coverImage)
            throw new ApiError(400, "avatar or coverimage is required for updation")

        const avatarUpdatedLocalPath = req.files?.avatar?.[0]?.path
        const coverImageUpdatedLocalPath = req.files?.coverImage?.[0]?.path

        let avatarUpdatedPath ={}, coverImageUpdatedPath = {}
        if(avatarUpdatedLocalPath)
            {avatarUpdatedPath = await uploadOnCloudinary(avatarUpdatedLocalPath)}
        if(coverImageUpdatedLocalPath)
           coverImageUpdatedPath = await uploadOnCloudinary(coverImageUpdatedLocalPath)

        let updatedUser = {}
        if(avatarUpdatedPath && coverImageUpdatedPath){
            updatedUser = await User.findByIdAndUpdate(req.user._id, 
              {
                $set:{
                    avatar: avatarUpdatedPath.url,
                    coverImage: coverImageUpdatedPath.url
                }
              },
              {
                new: true
              }
            ).select('-password -refreshToken')
        }
        else if(avatarUpdatedPath){
            updatedUser = await User.findByIdAndUpdate(req.user._id, 
                {
                  $set:{
                    coverImage: coverImageUpdatedPath.url,
                  }
                },
                {
                    new: true
                }
              ).select('-password -refreshToken')
        }
        else if(coverImageUpdatedPath){
            updatedUser = await User.findByIdAndUpdate(req.user._id, 
                {
                  $set:{
                      avatar: avatarUpdatedPath.url,
                  }
                },
                {
                    new: true
                }
              ).select('-password -refreshToken')
        }
        else{
            throw new ApiError(500, "error while uploading images")
        }
        
        res.status(200).json(
            new ApiResponse(200, updatedUser, "successfully updated images")
        )
    }
)
export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurretUser, updateUserDetails, updateAvatarOrCoverImage}