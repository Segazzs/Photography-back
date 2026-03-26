import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  if (!req.cookies.accessToken) {
    throw createHttpError(401, 'Missing acces token');
  }

  // const session = await Session.findOne({
  //   accessToken: req.cookies.accessToken,
  // });

  const { accessToken } = req.cookies;

  const session = await Session.findOne({
    accessToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isAccessTokenExpired =
    new Date() > new Date(session.accessTokenValidUntil);

  if (isAccessTokenExpired) {
    throw createHttpError(401, 'Access token expired');
  }

  const user = await User.findById(session.userId);

  if (!user) {
    throw createHttpError(401);
  }

  req.userId = session.userId;
  req.userId;

  next();
};
