import { Router } from 'express';
import { getSuggestedUsers, getUser, toggleFollowStatus, updateUser } from '../controllers/user.controller.js';
import protectRoute  from '../middleware/auth.middleware.js';
const router = Router();

router.get('/profile/:username', protectRoute, getUser);
router.get('/suggested', protectRoute, getSuggestedUsers);
router.post('/follow/:id', protectRoute, toggleFollowStatus);
router.post('/update', protectRoute, updateUser);

export default router;