import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //uploading file to cloudinary
      const response= await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })

       //file uploaded successfully
       console.log("File uploaded to Cloudinary: ",
       response.url);

       //deleting file from local uploads folder
    } catch (error) {
        fs.unlinkSync(localFilePath);//deleting file from local uploads folder
        return null;
    }
    }
    export { uploadToCloudinary };


