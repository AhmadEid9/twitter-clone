import {Router} from 'express'
import { getMe, login, signup } from '../controllers/auth.controller.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = Router()

router.get('/user', protectRoute, getMe)
router.post('/login', login)
router.post('/signup', signup)

export default router;