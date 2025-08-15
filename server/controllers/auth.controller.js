import bcrypt from "bcrypt"
import User from "../models/user.model.js"
import generateToken from "../utils/generateToken.js";
import logger from "../utils/logger.js";

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password are required' });
        }

        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        }).select("+password");

        if (!user) {
            return res.status(401).json({ error: 'Invalid Username or Email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Wrong password' });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: 'Login successful',
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            _id: user._id,
            followers: user.followers,
            following: user.following,
            profilePicture: user.profilePicture,
            coverPicture: user.coverPicture,
            bio: user.bio,
            link: user.link,
            token
        });
    } catch (error) {
        logger("error", error.message);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}

const signup = async (req, res) => {
    try{
        const { fullname, username, email, password } = req.body
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!fullname || !username || !email || !password) {
            return res.status(400).json({
                error: 'All fields are required'
            })
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email'
            })
        }
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters'
            })
        }

        const emailCheck = await User.findOne({ email })
        if (emailCheck) {
            return res.status(400).json({
                error: 'Email already taken'
            })
        }

        const usernameCheck = await User.findOne({ username })
        if (usernameCheck) {
            return res.status(400).json({
                error: 'Username already exists'
            })
        }

        const salt = await bcrypt.genSalt(10) 
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullname,
            username,
            email,
            password: hashedPassword
        })

        if (newUser){
            generateToken(newUser._id)
            await newUser.save()
            res.status(201).json({
                data: {
                    _id: newUser._id,
                    fullname: newUser.fullname,
                    username: newUser.username,
                    email: newUser.email,
                    followers: newUser.followers,
                    following: newUser.following,
                    profileImg: newUser.profileImg,
                    coverPic: newUser.coverPic
                }
            })
        } else {
            res.status(400).json({
                error: 'Invalid user data'
            })
        }

    } catch (error) {
        logger("error", error.message);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        })
    }
}

const getMe = async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({data: user});
    } catch (error) {
        logger("error", error.message);
        res.status(500).json({ error: 'Internal server error', description: error.message });
    }
}

export {
    login,
    signup,
    getMe
}