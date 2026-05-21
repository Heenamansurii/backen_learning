import { syncIndexes } from "../utils/syncIndexes.js";
import {ApiError} from "../utils/apiError.js";
import {user} from "../models/user.model.js";
import {uploadToCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/apiResponse.js";

const {regsterUser} = asyncHandler(async (req, res) => {
res.status(500).json({ message: "User registered successfully" });

//get user details from fronted
//validate the daata- if emptuy, if email is valid, if password is strong
//check if user already exists
//check for image chek for avatar
//upload the image to cloudinary,avtar
//create  usr onject - crate entry in db
//remove  paddword and refresh token field from reponse 
//check for use creation 
//return ressponse to frontend
//check if user already exists

const { fullname, email, username, password } = req.body;
console.log ("email", email);


if (
    [fullname, email, username, password].some((field) => !field || field.trim() === "")
)

{
    throw new ApiError("All fields are required", 400);
}

      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }]  

       })
         if (existingUser) {
            throw new ApiError("User with email or username already exists", 400);
         }
           const avatarLocalPath = req.files?.avatar[0]?.path
           const coverImageLocalPath = req.files?.coverImage[0]?.path[0]

         if (!avatarLocalPath ) {
            throw new ApiError("Avatar and cover image are required", 400);
         }

       const avatar = await uploadToCloudinary(avatarLocalPath);
        const coverImage = await uploadToCloudinary(coverImageLocalPath);
         
        if (!avatar || !coverImage) {
            throw new ApiError("Failed to upload images");
        }

               await User.create({
                    fullname,
                    avatar: avatar.url,
                    coverImage: coverImage?.url || "",
                    email,
                    password,
                    username: username.toLowerCase()
                })

               const createdUser = await User.fieldById(user._id).select("-password -refreshToken");

               if (!createdUser) {
                throw new ApiError("Failed to create user", 500);
               }

               return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
                
                })



export  {
    registerUser,
}