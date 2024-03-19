import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser' //used to access and set the cookies of the user's browser from our server

const app = express()

//'use' method is used for middlewares and configurations
//configuring the usage of the cors middleware, credentials is set to true to allow credentials to be sent with requests.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})) 


//configuring express
//using express.json middleware to parse incoming JSON payloads. It automatically parses the request body, assuming it's in JSON format, and attaches it to req.body.
//setting a limit on the size of the JSON payload to 16 kilobytes. If the payload exceeds this limit, it will result in a 413 (Payload Too Large) response.
app.use(express.json({limit: "16kb"}))


//using express.urlencoded middleware to parse incoming URL-encoded payloads (typically submitted through HTML forms)
//It also automatically parses the request body and attaches it to req.body.
//{ extended: true } allows for complex objects and arrays to be encoded into the URL-encoded format. Setting it to true enables parsing of such data.
//{ limit: "16kb" } sets a limit on the size of the URL-encoded payload to 16 kilobytes. If the payload exceeds this limit, it will result in a 413 (Payload Too Large) response.
app.use(express.urlencoded({extended: true, limit: "16kb"}))


//This line configures the express.static middleware to serve static files from the "public" directory. 
//particularly useful for serving frontend assets, such as HTML, CSS, client-side JavaScript, images, etc., directly through Express without the need for a dedicated server or additional routing for these static resources.
app.use(express.static("public"))


app.use(cookieParser())

//routes import
import router from './routes/user.route.js' 
import { subscriptionRouter } from './routes/subscription.route.js'

app.use("/api/v1/users", router)
app.use("/api/v1/subscriptions", subscriptionRouter)


export {app}