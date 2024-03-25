import {v2 as cloudinary} from 'cloudinary'  //sevice where we will store files, images and many more
import fs from 'fs'    //for managing file system in nodejs
import { asyncHandler } from './asyncHandler';
import { error } from 'console';


          

const uploadOnCloudinary = async (localFilePath) => {
    try {
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret:  process.env.CLOUDINARY_API_SECRET
          });
          
        if(!localFilePath) return null

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        console.log(`file has been uploaded on cloudinary successfully`, response.url)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        console.log(error)
        fs.unlinkSync(localFilePath) //if cloudinary file upload operation is failed then removing the locally saved temporary file i.e.localFilePath
        return null
    }
}

const deleteFileOfCloudinary = async(fileUrl) =>{
    const publicId = fileUrl?.split('/').pop().split('.')[0]
    // console.log(publicId)

    cloudinary.uploader.destroy(publicId, (error, result) => {
        if(error){
            console.log(error)
        }
        else(
            console.log(result || "older file deleted successfully")
        )
    })
}

const getViewsAndDurationofVideo = async(fileUrl)=>{
    const publicId = fileUrl?.split('/').pop().split('.')[0]
    cloudinary.api.resource(publicId, {resource_type: 'video', derived: true})
    .then(response =>{
        const duration = response.duration
        console.log(`duration: ${duration}`)

        const views = response.views
        console.log(`views: ${views}`)

        return {views, duration}
    })
    .catch(error =>{
        console.log(`Error while getting details of video`)
    })
}

export {uploadOnCloudinary, deleteFileOfCloudinary, getViewsAndDurationofVideo}