import mongoose, {Schema, modelNames} from "mongoose";
import jwt from 'jsonwebtoken' //for tokenization
import bcrypt from 'bcrypt'  //for encryption

const userSchema = new Schema({
  watchHistory: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }
  ],
  userName: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true, //Trim leading and trailing whitespaces in the string
    index: true, //By creating indexes on fields commonly used in queries, you can significantly speed up the retrieval of data.
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true,     
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true,     
  },
  avatar: {
    type: String, //cloudinary url
    required: true
  },
  coverImage: {
    type: String,
    
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  refreshToken: {
    type: String,
    
  },
}, {timestamps: true})

//arrow function is not used here becoz we have to use 'this' here and it does not know the current context  
userSchema.pre("save", async function (next){
    if(this.isModified("password"))
      this.password = bcrypt.hash(this.password, 10)
    next()
})

//mongoose allows creating custom method i.e.'isPasswordCorrect'
// Initially, both this.password and password point to the same string object, which is the plain text password.
// During the bcrypt.hash operation, a new object (the hashed password) is created, and this.password is then updated to point to this new object. Meanwhile, password (in the context of the middleware function) continues to reference the original plain text password.
// So, after the hashing operation, this.password and password refer to different objects. this.password points to the object containing the hashed data, and password (in the context of the middleware) still refers to the original plain text password. This allows the middleware to update the document's password field with the hashed value before saving it to the database.
//This might happen due to the timing of the getter/setter mechanism.
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
  return  jwt.sign(
  {
  _id: this._id,   //_id from MondoDB
  email: this.email,
  userName: this.userName,
  fullName: this.fullName 
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  }
  )
}
userSchema.methods.genrateRefreshToken = function(){
  return  jwt.sign(
    {
    _id: this._id,   //_id from MondoDB
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
    }
    )
}
export const User = mongoose.model("User", userSchema)