import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos = await Video.aggregate([
        {
            $group: {
                _id: ObjectId('_id'),
              }
        }
    ])
    return res.status(200).json(new ApiResponse(200, videos[0], "Video fetched successfuly"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "Title and description is required")
    }

    const videoFile = req.files?.videoFile[0].path
    const thumbnailFile = req.files?.thumbnail[0].path


    if (!(videoFile && thumbnailFile)) {
        throw new ApiError(400, "Both video and thumbnail file is required")
    }


    const serverVideo = await uploadOnCloudinary(videoFile)
    const thumbnailImage = await uploadOnCloudinary(thumbnailFile)


    if (!(serverVideo && thumbnailImage)) {
        throw new ApiError(500, "Error while upload video")
    }

    const video = await Video.create({
        videoFile: serverVideo.url,
        thumbnail: thumbnailImage.url,
        title,
        description,
        duration: serverVideo.duration,
        owner: req.user._id
    })

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video uploaded successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }
    const video = await Video.findById(videoId)

    res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail
    if (!videoId || !title || !description) {
        throw new ApiError(400, "videoId, title, description is required!")
    }

    const thumbnail = req.file?.path
    if(!thumbnail){
        throw new ApiError(400, "thumnail is required!")

    }

    const video = await Video.findById(videoId);

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(400, "Error while updating video.")
    }

    const thumbnailFile = await uploadOnCloudinary(thumbnail)

    if (!thumbnailFile.url) {
        throw new ApiError(400, "Error while update video thumnail")
    }


    await deleteFromCloudinary(video.url)

    const savedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnailFile.url,
                title,
                description
            }
        },
        {
            new: true
        }
    )
    return res.status(200).json(new ApiResponse(200, savedVideo, "Video updated successfuly"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findById(videoId)

    if (!(video.owner.equals(req.user._id))) {
        throw new ApiError(400, "Error while deleting video")
    }

    const deletedVideo = await Video.findOneAndDelete(videoId)
    return res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfuly"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findById(videoId)

    if (!(video.owner.equals(req.user._id))) {
        throw new ApiError(400, "Error while deleting video")
    }

    const toggledVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: !video.isPublished
        }
    },
    {
        new: true
    }
    )
    return res.status(200).json(new ApiResponse(200, toggledVideo, "Video publish status updated"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
