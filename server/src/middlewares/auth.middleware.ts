import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { sendError } from '../utils/response.utils';
import { User } from '../models/User.model';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Please log in.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('+sessionVersion');
    if (!user || user.sessionVersion !== decoded.sessionVersion) {
      sendError(res, 'Your session has expired. Please log in again.', 401);
      return;
    }
    req.user = { id: decoded.id, email: user.email, sessionVersion: decoded.sessionVersion };
    next();
  } catch {
    sendError(res, 'Invalid or expired token. Please log in again.', 401);
  }
};
