import express from 'express';
import { exportExcel } from '../controllers/exportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/excel', protect, authorize('admin', 'operator'), exportExcel);

export default router;
