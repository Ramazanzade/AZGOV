import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const cookieName = process.env.COOKIE_NAME || 'auth_token';
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Autentifikasiya tələb olunur' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Token etibarsızdır' });
  }

  req.user = payload;
  next();
};


// Optional auth — token varsa user-i qoy, yoxsa davam et
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const cookieName = process.env.COOKIE_NAME || 'auth_token';
  const token = req.cookies?.[cookieName];
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
};