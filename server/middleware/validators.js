import { body, param } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'operator']).withMessage('Invalid role'),
];

export const participantValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('industryName').trim().notEmpty().withMessage('Industry name is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required'),
];

export const participantUpdateValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('industryName').optional().trim().notEmpty(),
  body('mobile').optional().trim().matches(/^[0-9+\-\s]{10,15}$/),
  body('email').optional({ checkFalsy: true }).isEmail(),
];

export const sameIndustryMemberValidation = [
  body('fullName').trim().notEmpty().withMessage('Name is required'),
  body('industryName').trim().notEmpty().withMessage('Industry name is required'),
  body('mobile')
    .trim()
    .matches(/^[0-9+\-\s]{10,15}$/)
    .withMessage('Valid mobile number is required'),
];

export const idValidation = [param('id').isUUID().withMessage('Invalid ID')];

export const verifyValidation = [
  body('qrData').notEmpty().withMessage('QR data is required'),
];

export const verifyMemberOtpValidation = [
  body('participantId').trim().notEmpty().withMessage('Participant ID is required'),
  body('parentParticipantId').trim().notEmpty().withMessage('Parent Participant ID is required'),
  body('mobile')
    .trim()
    .matches(/^[0-9+\-\s]{10,15}$/)
    .withMessage('Valid mobile number is required'),
  body('otp')
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('OTP must be 6 digits'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('industryName').trim().notEmpty().withMessage('Industry name is required'),
];
