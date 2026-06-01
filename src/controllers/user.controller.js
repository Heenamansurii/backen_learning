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
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
     const user = await User.findById(userId)
     const accessToken = user.generateAccessToken();
     const refreshToken = user.generateRefreshToken();
     user.refreshToken = refreshToken;
     await user.save({validateBeforeSave: false});
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

        //generate access token and refresh token
      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

   
       const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


          //cookie options
          const options = {
            httpOnly: true,
            secure:true,
          }

          return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
            .json
            (new ApiResponse(
                200, 
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
            )
        )
        });

        const logoutUser = asyncHandler(async (req, res) => {
         await  User.findByIdAndUpdate(
            req.user._id, 
            {
                $set: {refreshToken:undefined}
            }, 
            
               { new: true }
            

        );
    
    
        
            const options = {
                httpOnly: true,
                secure:true,
            };

            return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, null, "User logged out successfully"))
            });
 const refreshAccessToken = asyncHandler(async (req, res) => {
        const refreshToken =
        req.cookies.refreshToken || req.body.refreshToken 
        if (!refreshToken) {
            throw new ApiError(401, "Unauthorized, no refresh token provided");
        }
        try {
      const decodedToken = jwt .verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,

        )
       const user = await User.findById(decodedToken._id)
       if (!user)
         {throw new ApiError(401, "Unauthorized, user not found");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Unauthorized, invalid refresh token");
        }
         const options = {
            httpOnly: true,
            secure:true,
        }
          const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

         return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", refreshToken, options)
         .json(
            new ApiResponse(200, { accessToken , refreshToken:newRefreshToken   }, 
                "Access token refreshed successfully"
            )
         )
        } catch (error) {
            throw new ApiError(401, error?.message || "Unauthorized, invalid refresh token");
        }

    })

    const changeCurrentPassword = asyncHandler(async (req, res) => {
        const{ currentPassword, newPassword } = req.body;

  
      const user= await User.findById(req.user?._id)// ither .d  hai
  const isPasswordCorrect=   await user.isPasswordCorrect(oldPassword)
  
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Current password is incorrect");
  }

    user.password = newPassword;
   await user .save({validateBeforeSave: false});

   return res.status(200).json(new ApiResponse(200,{}, "Password changed successfully"));
    })
   
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
})

    const updateAccountDetails = asyncHandler(async (req, res) => {
        const { fullname, email } = req.body;

        if (!fullname && !email) {
            throw new ApiError(400, "At least one field (fullname or email) is required to update");
        }

       const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullname,
                    email: email 
                }
            },
            { new: true }
        ).select("-password");

        res.status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
        })
            const    updateUserAvatar = asyncHandler(async (req, res) => {

              const avatarLocalPath =  req.file?.path 
              if (!avatarLocalPath) {
                throw new ApiError(400, "Avatar file is required");
              }

              const avatar = await uploadToCloudinary(avatarLocalPath);
              if (!avatar.url ) {
                throw new ApiError(500, "Failed to upload avatar");

              }
                const user = await User.findByIdAndUpdate(
                    req.user?._id,
                    {
                        $set: { avatar: avatar.url }
                    },
                    { new: true }
                ).select("-password");
                return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));

                
            })
            const updateUserCoverImage = asyncHandler(async (req, res) => {

                const coverImageLocalPath =  req.file?.path 
                if (!coverImageLocalPath) {
                  throw new ApiError(400, "Cover image file is required");
                }
  
                const coverImage = await uploadToCloudinary(coverImageLocalPath);
                
                if (!coverImage.url ) {
                  throw new ApiError(500, "Failed to upload cover image");
  
                }
                    const user = await User.findByIdAndUpdate(  
                        req.user?._id,
                        {
                            $set: { coverImage: coverImage.url }
                        },
                        { new: true }
                    ).select("-password");
                    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));

  
                    
                })
 const getUserChannelProfile = asyncHandler(async (req, res) => {       

        const { channelId } = req.params;  
        if (!username?.trim()) {
            throw new ApiError(400, "Channel ID is required");
        }
const channel =await User.aggregate([
    {
        $match: {
            username: username?.toLowerCase()
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
     {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subscriberCount: { 
                $size: "$subscribers" },
            },
            channelIsSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: {
                        $in: [req.user?._id, "$subscribers.subscriber"]
                    },
                    then: true,
                    else: false
                }

            }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            subscriberCount: 1,
            channelIsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,

        }
    }
])    
       if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
       }
       return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"));
 })  
  const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchedHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "uploader",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner:{
                                             $first: "$owner"}
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0]?.watchedHistory || [], "Watch history fetched successfully"));

})

    export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar
    ,updateUserCoverImage,
    getUserChannelProfile ,
    getWatchHistory  ,
};