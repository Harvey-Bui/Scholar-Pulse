import { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AppError } from './errorHandler';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    next(new AppError(401, 'Not authenticated'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, 'Session expired'));
  }
};
