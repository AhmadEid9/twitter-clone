import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^[a-z][a-z0-9]+$/, 'Username must start with a letter, contain only lowercase letters and numbers, and have no special characters']        
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        select: false
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }
    ],
    likedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            default: []
        }
    ],
    profileImg: {
        type: String,
        default: ''
    },
    profileImgId: {
        type: String,
        default: ''
    },
    coverPic: {
        type: String,
        default: ''
    },
    coverPicId: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema)

export default User