import Post from "../models/post.model.js"
import User from "../models/user.model.js";
import imagekit from "../utils/imagekit.js"
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from 'uuid';


const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { image } = req.body;

        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!text && !image) {
            return res.status(400).json({ error: 'Text or image is required' });
        }

        let imageId = '';

        if (image) {
            try {
                const { url, fileId } = await imagekit.upload({
                    file: image,
                    fileName: `${uuidv4()}.jpg`
                });
                image = url;
                imageId = fileId;
            } catch (err) {
                logger('error', err.message);
            }
        }

        const post = new Post({
            user: req.user._id,
            text,
            image,
            imageId
        })

        await post.save();
        return res.status(201).json({message: 'Post created successfully'});
    } catch (error) {
        logger('error', error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}


const getPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const lastId = req.query.lastId;

        const query = {};

        if (lastId) {
            query._id = { $lt: lastId };
        }

        const posts = await Post.find(query)
            .sort({ _id: -1 })
            .limit(limit)
            .populate('user', 'username profilePic').populate('comments.user');

        if (posts.length === 0) {
            return res.status(200).json({ data: [] });
        }
        const newLastId = posts.length > 0 ? posts[posts.length - 1]._id : null;

        return res.status(200).json({
            data: posts,
            nextCursor: newLastId
        });

    } catch (error) {
        logger('error', error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate("user")
            .populate("comments.user");
        return res.status(200).json({data: posts});
    } catch (error) {
        logger('error', error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }   
}


const getPost = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        return res.status(200).json({data: post});
    } catch (error) {
        logger('error', error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        let { image } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user._id.toString() != req.user._id) {
            return res.status(403).json({ error: 'You are not authorized to update this post' });
        }

        if (!text && !image) {
            return res.status(400).json({ error: 'Text or image is required' });
        }

        if (image) {
            try {
                if (post.imageId) {
                    await imagekit.deleteFile(post.imageId);
                }
                const { url, fileId } = await imagekit.upload({
                    file: image,
                    fileName: `${uuidv4()}.jpg`
                });
                image = url;
                post.image = image;
                post.imageId = fileId;
                
            } catch (error) {
                logger('error', error.message);
                return res.status(500).json({ error: 'Internal server error', description: error.message });
            }

            post.text = text || post.text;
            await post.save();
            return res.status(200).json({message: 'Post updated successfully'});
        }

    } catch (error) {
        logger('error', error.message);
        return res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const deletePost = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user._id.toString() != req.user._id) {
            return res.status(403).json({ error: 'You are not authorized to delete this post' });
        }

        if (post.imageId) {
            try {
                await imagekit.deleteFile(post.imageId);
            } catch (err) {
                logger('error', err.message);
                return res.status(500).json({ error: 'Internal server error', description: err.message });
            }
        }

        await Post.findByIdAndDelete(id);
        return res.status(200).json({message: 'Post deleted successfully'});
    } catch (error) {
        logger('error', error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }  
}

const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const post = await Post.findById(id);

        if(!user){
            return res.status(404).json({error : "User not found"});
        }

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const notification = new Notification({
            from: userId,
            to: post.user,
            read: false
        })
        if (post.likes.includes(userId)) {
            user.likedPosts.pull(id);
            post.likes.pull(userId);
            notification.type ='like';

        } else {
            user.likedPosts.push(id);
            post.likes.push(userId);
            notification.type = 'unlike'
        }

        await Promise.all([user.save(), post.save(), notification.save()]);
        return res.status(200).json({message: 'Post liked successfully'});
    } catch (error) {
        logger('error', error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }

}

const getLikedPosts = async (req, res) =>{
    try {
        const userId = req.params.id;

        const user = User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } }).populate('user', 'username profilePic').populate('comments.user');
        return res.status(200).json({data: likedPosts});

    } catch (error) {
        logger('error', error.message);
        return res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const commentPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { text } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        post.comments.push({ user: userId, text });

        const notification = new Notification({
            from: userId,
            to: post.user,
            type: 'comment',
            read: false
        })

        await Promise.all([post.save(), notification.save()]);
        return res.status(200).json({message: 'Post commented successfully'});
    } catch (error) {
        logger('error', error.message);
        return res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const following = user.following;
        const posts = await Post.find({ user: { $in: following }})
        .sort({ createdAt: -1 })
        .populate("user")
        .populate("comments.user");
        return res.status(200).json({data: posts});
    } catch (error) {
        logger('error', error.message);
        return res.status(500).json({ error: 'Internal server error', description: error.message });
    } 
}

export {
    createPost,
    getPosts,
    getUserPosts,
    getPost,
    updatePost,
    deletePost,
    likePost,
    commentPost,
    getLikedPosts,
    getFollowingPosts
}