import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

export {registerUser}