import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as userRepo from '../repositories/userRepository.js';
import { generateToken } from '../utils/generateToken.js';
import { logAudit } from '../services/auditService.js';
import { hashPassword, matchPassword } from '../utils/password.js';
import { toApiDoc } from '../utils/serialize.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await userRepo.findUserByEmail(email);
  if (!user || !(await matchPassword(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  await logAudit({
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    user: toApiDoc(user),
    req,
  });

  res.json({
    success: true,
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    },
  });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await userRepo.findUserByEmail(email);
  if (exists) throw new ApiError(400, 'User already exists');

  const user = await userRepo.createUser({
    name,
    email,
    password: await hashPassword(password),
    role: role || 'operator',
  });

  await logAudit({
    action: 'REGISTER',
    entity: 'User',
    entityId: user.id,
    user: req.user,
    details: { email },
    req,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});
