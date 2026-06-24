import express from 'express';
import { verifyQr } from '../controllers/verifyController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { verifyValidation } from '../middleware/validators.js';

const router = express.Router();

router.post('/', protect, verifyValidation, validate, verifyQr);

export default router;
