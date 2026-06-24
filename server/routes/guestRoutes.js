import express from 'express';
import { createGuest, getGuests, deleteGuest } from '../controllers/guestController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.post('/', createGuest);
router.get('/', getGuests);
router.delete('/:id', deleteGuest);

export default router;
