import { createRequire } from "module";
const require = createRequire(import.meta.url);
import bcrypt from 'bcryptjs';
import User from "../models/user.model";
const jwt = require("jsonwebtoken");


export const register = async (req, res) => {
    try {
        // Get user input
        const { username, email, password } = req.body;

        // Validate user input
        if (!(username && username && username)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).json({
                result: false,
                payload: "User Already Exist. Please Login"
            });
        }

        //Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);
        
        // Create user in our database
        const user = await User.create({
            username,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email, is_admin: false },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json({
            result: true,
            payload: user
        });
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
}


export const delUser = async (req, res) => {
    try {

        const { user_id } = req.body.user_id;
        if (req.body.user.is_admin) {
            await User.deleteOne({_id: user_id});

            res.status(200).json({
                result: true,
                payload: 'User has deleted!'
            })
        } else {
            res.status(400).json({
                result: false,
                payload: `You don't have right permission.`
            })
        }
    } catch (err) {
        res.status(400).json({
            result: false,
            payload: `Database error`
        })
    }
    
}

export const updatePassword = async (req, res) => {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        res.status(400).json({
            result: false,
            payload: 'Input parameter is required!'
        })
    }

    try {
        const user = await User.findById(req.body.user.user_id);

        if (user.password == await bcrypt.hash(old_password, 10)) {
            // update user password

            user.password = await bcrypt.hash(new_password, 10);
            await user.save()
            res.status(400).json({
                result: true,
                payload: 'Password has updated.'
            })
        } else {
            res.status(400).json({
                result: false,
                payload: 'Old password is not matched.'
            })
        }
    } catch (err) {
        res.status(400).json({
            result: false,
            payload: 'Database error!'
        })
    }
}

export const login = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            result: false,
            payload: 'Input parameter is required!'
        })
    }

    
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        console.log(await bcrypt.compare(password, user.password), user)

        if (user && await bcrypt.compare(password, user.password) && user.enabled) {
            

            const token = jwt.sign(
                { user_id: user._id, email, is_admin: user.is_admin },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "48h",
                }
            );
            // save user token
            const payloadUser = user.toJSON();
            payloadUser.token = token;
            delete payloadUser.password;
            res.status(200).json({
                result: true,
                payload: payloadUser
            })
        } else {
            res.status(400).json({
                result: false,
                payload: 'email or password is wrong or you are not allowed yet!'
            })
        }
    } catch (err) {

        console.log(err);
        res.status(500).json({
            result: false,
            payload: 'db operation error.'
        })
    }
}

export const restore = async (req, res) => {
    res.status(200).json({
        result: true
    })
}