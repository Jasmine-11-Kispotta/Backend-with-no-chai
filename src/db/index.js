import mongoose from'mongoose'
import { DB_NAME } from '../constants.js'


const connectDB = async() => {
   try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`)
   } catch(error){
       console.log("MongoDB connection error: "+ error)
       process.exit(1) //function for stopping the process in nodejs
   }
}

export default connectDB //default means that you are designating a specific entity (usually a function, class, or an object) as the default export for that module. Only one entity can be the default export in a module.
