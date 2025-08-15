import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    
    const authHeader = req.headers.authorization;
    try {
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    res.status(401).json({ error: 'Invalid token', description: err.message });
                } else {
                    const user = await User.findById(decoded._id).select('-password');

                    if (!user) {
                        return res.status(401).json({ error: 'User not found' });
                    }
                    
                    req.user = user;
                    next();
                }
            });
        } else {
            res.status(401).json({ error: 'Token not provided or invalid' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

export default authMiddleware;