import {v2 as cloudinary} from 'cloudinary'  //sevice where we will store files, images and many more
import fs from 'fs'    //for managing file system in nodejs

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log(`file has been uploaded on cloudinary successfully`, response.url)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //if cloudinary file upload operation is failed then removing the locally saved temporary file i.e.localFilePath
        return null
    }
}

export {uploadOnCloudinary}