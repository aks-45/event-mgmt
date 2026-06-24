import express from 'express';
import { getAttendance, createAttendance, getPendingList, markManualAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/pending', getPendingList);
router.post('/manual', markManualAttendance);
router.route('/').get(getAttendance).post(createAttendance);

export default router;
