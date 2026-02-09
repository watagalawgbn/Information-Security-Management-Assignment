import express from 'express';
import { verifyOTP, signup, login, createProfile, updatePassword } from '../controllers/authController.js';
import { Auth, IsSuperAdmin, IsAdmin, IsTouroperator } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/createprofile', createProfile);
router.patch('/verifyotp', verifyOTP);
router.post('/signup', signup);
router.post('/login', login);
router.patch('/setpassword', updatePassword);

export default router;
