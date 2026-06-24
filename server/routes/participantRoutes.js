import express from 'express';
import {
  createParticipant,
  getParticipants,
  getParticipant,
  updateParticipant,
  deleteParticipant,
  getDashboardStats,
  bulkImportParticipants,
  addSameIndustryMember,
} from '../controllers/participantController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  participantValidation,
  participantUpdateValidation,
  sameIndustryMemberValidation,
  idValidation,
} from '../middleware/validators.js';

const router = express.Router();
router.use(protect);

router.get('/stats/dashboard', getDashboardStats);
router.route('/').get(getParticipants).post(participantValidation, validate, createParticipant);
router.post('/bulk-import', authorize('admin'), bulkImportParticipants);
router.post('/:id/add-member', idValidation, sameIndustryMemberValidation, validate, addSameIndustryMember);
router
  .route('/:id')
  .get(idValidation, validate, getParticipant)
  .put(idValidation, participantUpdateValidation, validate, updateParticipant)
  .delete(idValidation, validate, authorize('admin'), deleteParticipant);

export default router;
