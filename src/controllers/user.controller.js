// res.status(500).json({ message: "User registered successfully" });
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

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userI) => {
    try {
     const user = await User.findById(userIid)
     const accessToken = user.generateAccessToken();
     const refreshToken = user.generateRefreshToken();
     usr.refreshToken = refreshToken;
     await usr.save({validateBeforeSave: false});
     return { accessToken, refreshToken };


    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
};



//request body
 const registerUser = asyncHandler(async (req, res) => {
 const { fullname, email, username, password } = req.body;

    console.log("===== REGISTER HIT =====");
    console.log("Files:", req.files);
    console.log("Body:", req.body);

     
    //if any of the fields are missing or empty, throw an error
    if (
        [fullname, email, username, password].some((field) => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //usrr is already exists with the same email or username
       const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    //if yes existing user is found, throw an error
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    // console.log("Avatar Path:", avatarLocalPath);
    // console.log("Cover Path:", coverImageLocalPath);


    //
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //if avatar is missing, throw an error
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required");
    }

    //upload the avatar and cover image to cloudinary
    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadToCloudinary(coverImageLocalPath) : undefined

    //if avatar upload fails, throw an error
    if (!avatar) {
        throw new ApiError(400, "avatar file is required");
    }

    //create user object and save to database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

     //password and refresh token should not be sent in the response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

     //check if user creation is successful
    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    //   
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));

});

       const loginUser = asyncHandler(async (req, res) => {
        //request body=data
        //username and email
        //find the user
        //password check
        //access token and refresh token
        //send cookie and response

        const { email,username, password } = req.body;

        if (!email && !username) {
            throw new ApiError(400, "Email or username is required");
        }

        const user = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (!user) {
            throw new ApiError(404, "User not found");
            }

       const isPasswordValid = await user.isPasswordMatch(password);

       if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
       }

      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true
        });



export {
    registerUser,
    loginUser
};