import { User } from '../models/user.js';
import createHttpError from 'http-errors';

export const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user || user.role !== 'admin') {
    return next(createHttpError(403, 'Forbidden'));
  }

  next();
};
