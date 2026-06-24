import express from 'express';
import multer from 'multer';
import {
  uploadBulkMembers,
  liveSearchMembers,
  checkInExcel,
  searchMemberByIndustry,
  getBulkMembersStats,
  clearAllBulkMembers,
} from '../controllers/bulkMembersController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/live-search', liveSearchMembers);
router.get('/check', checkInExcel);
router.get('/search', searchMemberByIndustry);
router.get('/stats', getBulkMembersStats);

router.post('/upload', authorize('admin'), upload.single('file'), uploadBulkMembers);
router.delete('/clear', authorize('admin'), clearAllBulkMembers);

export default router;
