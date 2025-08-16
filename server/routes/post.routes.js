import { Router } from "express";

import { createPost, getPosts, getPost, updatePost, deletePost, likePost, commentPost, getFollowingPosts, getUserPosts } from "../controllers/post.controller.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = Router();

router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likePost );
router.post('/comment/:id', protectRoute, commentPost );
router.get('/all', protectRoute, getPosts);
router.get('/posts/user/:username', protectRoute, getUserPosts);
router.get('/post/:id', protectRoute, getPost);
router.get('/liked/:id', protectRoute, getPosts);
router.get('/followed/:id', protectRoute, getFollowingPosts);
router.put('/update/:id', protectRoute, updatePost);
router.delete('/delete/:id', protectRoute, deletePost);

export default router;