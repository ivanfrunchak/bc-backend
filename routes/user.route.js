import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express');
import * as auth from "../middleware/auth";
const router = express.Router();
import * as UserController from '../controllers/user.controller';

router.post('/register', UserController.register);
router.use(auth.verifyToken).post('/login', UserController.login);
router.use(auth.verifyToken).post('/updatePassword', UserController.updatePassword);
router.use(auth.verifyToken).post('/delUser', UserController.delUser);
router.use(auth.verifyToken).post('/restore', UserController.restore);
router.use(auth.verifyToken).get('/restore', UserController.restore);

export default router;