import express from 'express';
import multer from 'multer';
import {
  uploadHonoraryGuests,
  getHonoraryGuests,
  getHonoraryStats,
  clearHonoraryGuests,
} from '../controllers/honoraryGuestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/', getHonoraryGuests);
router.get('/stats', getHonoraryStats);

router.post('/upload', authorize('admin'), upload.single('file'), uploadHonoraryGuests);
router.delete('/clear', authorize('admin'), clearHonoraryGuests);

export default router;
