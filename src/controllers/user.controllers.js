import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserLoginType } from "../constants/constants.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // attach refresh token to the user document to avoid refreshing the access token with multiple refresh tokens
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating the access token"
        );
    }
};

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // check if incoming refresh token is same as the refresh token attached in the user document
        // This shows that the refresh token is used or not
        // Once it is used, we are replacing it with new refresh token below
        if (incomingRefreshToken !== user?.refreshToken) {
            // If token is valid but is used already
            throw new ApiError(401, "Refresh token is expired or used");
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const existedUser = await User.findOne({
        $or: [{ email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email already exists", []);
    }
    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        loginType: UserLoginType.EMAIL_PASSWORD
    });

    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                "User registered successfully."
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(400, "User does not exists")
    }

    if (user.loginType !== UserLoginType.EMAIL_PASSWORD) {
        throw new ApiError(
            400,
            "You have previously registered using " +
            user.loginType?.toLowerCase() +
            ". Please use the " +
            user.loginType?.toLowerCase() +
            " login option to access your account."
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };
    const loggedInUser = await User.findById(user._id).select('-password -avatarImage -loginType -refreshToken -forgotPasswordToken -forgotPasswordExpiry');

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken }, // send access and refresh token in response if client decides to save them by themselves
                "User logged in successfully"
            )
        );

});

const updateUserAvatar = asyncHandler(async (req, res) => {
    console.log(req)
    if (!req.file?.filename) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatarUrl = getStaticFilePath(req, req.file?.filename);
    const avatarLocalPath = getLocalPath(req.file?.filename);

    const user = await User.findById(req.user._id);
    const updateAvater = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatarImage: {
                    url: avatarUrl,
                    localPath: avatarLocalPath
                }
            }
        },
        { new: true }
    ).select('-password -avatarImage -loginType -refreshToken -forgotPasswordToken -forgotPasswordExpiry');

    removeLocalFile(user.avatar.localPath);
    return res
        .status(200)
        .json(new ApiResponse(200, updateAvater, "Avatar updated successfully"));
})
export { generateAccessAndRefreshTokens, registerUser, loginUser, refreshAccessToken, updateUserAvatar }