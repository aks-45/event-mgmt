import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as userRepo from '../repositories/userRepository.js';
import { toApiDoc } from '../utils/serialize.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await userRepo.findUserById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  const { password: _, ...safe } = user;
  req.user = toApiDoc(safe);
  next();
});

export const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized`);
    }
    next();
  });
