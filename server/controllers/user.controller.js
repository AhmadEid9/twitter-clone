import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import imagekit from "../utils/imagekit.js";
import logger from "../utils/logger.js";
import bcrypt from "bcrypt"

const getUser = async (req, res) => {
    consOne = req.params.username;
    try {
        const user = await User.findOne(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({data: user});
    } catch (error) {
        logger("error", error.message);
        return res.status(500).json({ error: 'Internal server error', description: error.message });
    }
};

const toggleFollowStatus = async (req, res) => {
    const user = req.user;
    const followingUser = req.params.id;
    
    if (user._id == followingUser) {
        return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    try{
        const following = await User.findById(followingUser).select('-password');
        if (!following) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.following.includes(following._id)) {
            user.following.pull(following._id);
            following.followers.pull(user._id);
        } else {
            user.following.push(following._id);
            following.followers.push(user._id);
        }
        const notification = new Notification({
            type: 'follow',
            from: user._id,
            to: following._id,
            read: false
        })
        await Promise.all([user.save(), following.save(), notification.save()]);
        res.status(200).json({ message: 'Follow status toggled successfully' });
    } catch (error) {
        logger("error", error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id

        const followedUsers = await User.findById(userId).select('following');

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId }
                }
            },
            {
                $sample: {
                    size: 10
                }
            },
            { $project: 
                {
                    password: 0
                }
            }
        ])

        const filteredUsers = users.filter(user => !followedUsers.following.includes(user._id))

        const suggestedUsers = filteredUsers.slice(0, 5);

        res.status(200).json({data: suggestedUsers});
    } catch (error) {
        logger("error", error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const updateUser = async (req, res) => {

    const  { fullname, username, email, currentPassword, newPassword, bio, link} = req.body;

    let { profileImg, coverPic} = req.body

    const userId = req.user._id;

    try {
        const user = await User.findById(userId).select('+password');

        if (!user) {
            res.status(404).json({ error: "User not found" })
        }

        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username });
            if (usernameExists) {
                return res.status(400).json({ error: "Username is already taken" });
            }
            user.username = username;
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ error: "Email is already in use" });
            }
            user.email = email;
        }

        if ((!currentPassword && newPassword) || (!newPassword && currentPassword)) {
            return res.status(400).json({ error: "Both current password and new password are required" }) 
        }
        
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (newPassword && newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters" })
            }
            if (!isMatch) {
                return res.status(400).json({ error: "Current password is incorrect" })
            }
            
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);   
        }

        if (profileImg) {
            if (user.profileImgId) {
                try {
                    await imagekit.deleteFile(user.profileImgId);
                } catch (error) {
                    logger("error", "Failed to delete old profile image: " + error.message);
                    return res.status(500).json({ error: "Failed to delete old profile image" });
                }
            }
            const uploadResponse = await imagekit.upload({
                file: profileImg,
                fileName: `profile_${userId}_${Date.now()}.jpg`,
                folder: "/profiles"
            });

            user.profileImg = uploadResponse.url;
            user.profileImgId = uploadResponse.fileId;
        }

        if (coverPic) {
            if (user.coverPicId) {
                try {
                    await imagekit.deleteFile(user.coverPicId);
                } catch (error) {
                    logger("error", "Failed to delete old cover image: " + error.message);
                    return res.status(500).json({ error: "Failed to delete old cover image" });
                }
            }
            const uploadResponse = await imagekit.upload({
                file: coverPic,
                fileName: `cover_${userId}_${Date.now()}.jpg`,
                folder: "/covers"
            });

            user.coverPic = uploadResponse.url;
            user.coverPicId = uploadResponse.fileId;
        }

        user.fullname = fullname || user.fullname;
        user.bio = bio || user.bio;
        user.link = link || user.link;

        await user.save();
        res.status(200).json({ message: "User updated successfully" });

    } catch (error) {
        logger("error", error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }

}

export { getUser, toggleFollowStatus, getSuggestedUsers, updateUser };