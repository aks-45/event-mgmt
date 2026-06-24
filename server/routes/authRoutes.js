import express from 'express';
import { login, register, getMe } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginValidation, registerValidation } from '../middleware/validators.js';

const router = express.Router();

router.post('/login', loginValidation, validate, login);
router.post('/register', protect, authorize('admin'), registerValidation, validate, register);
router.get('/me', protect, getMe);

export default router;
