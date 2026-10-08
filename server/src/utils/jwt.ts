import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export interface JwtPayload {
  userId: string;
  email: string;
}

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET çox qısadır və ya yoxdur. .env faylını yoxla.');
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};