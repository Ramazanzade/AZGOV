import { Request, Response } from 'express';
import {
  findUserByEmail,
  findOrCreateUser,
  createOtp,
  verifyOtp
} from '../services/authService';
import { sendOtpEmail } from '../services/emailService';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/authMiddleware';
import { verifyGoogleToken } from '../services/googleService';
import {
  createUnverifiedUser,
  markEmailVerified,
  verifyPassword,

} from '../services/authService';const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 gün
    path: '/'
  });
};

// ============================================================
// POST /api/auth/register — STEP 1
// ============================================================
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validasiya
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Düzgün email daxil edin' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Parol minimum 6 simvol olmalıdır' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Ad minimum 2 simvol olmalıdır' });
  }

  try {
    // 1. User yarat (email_verified = false)
    await createUnverifiedUser(email, password, name.trim());

    // 2. OTP yarat və göndər
    const code = await createOtp(email);
    await sendOtpEmail(email, code);

    res.status(201).json({
      success: true,
      needsVerification: true,
      email,
      message: 'Təsdiq kodu email ünvanınıza göndərildi'
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================================
// POST /api/auth/verify-signup — STEP 2
// ============================================================
export const verifySignup = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email və kod tələb olunur' });
  }

  try {
    // 1. OTP yoxla
    const result = await verifyOtp(email, code);

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'Kod tapılmadı və ya vaxtı bitib',
        expired: 'Kodun vaxtı bitib',
        used: 'Kod artıq istifadə olunub',
        max_attempts: 'Çox cəhd etdiniz. Yeni kod tələb edin',
        wrong_code: 'Kod yanlışdır'
      };
      return res.status(400).json({
        success: false,
        message: messages[result.reason || 'not_found'] || 'Kod yanlışdır'
      });
    }

    // 2. User-i tap və verified et
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    const verifiedUser = await markEmailVerified(user.id);

    // 3. JWT ver
    const token = signToken({ userId: verifiedUser.id, email: verifiedUser.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        avatarUrl: verifiedUser.avatarUrl
      }
    });
  } catch (err: any) {
    console.error('verifySignup xətası:', err);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
};
// ============================================================
// POST /api/auth/login  (email + parol)
// ============================================================
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email və parol tələb olunur' });
  }

  try {
    const user = await verifyPassword(email, password);
    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
};

// ============================================================
// POST /api/auth/send-otp
// ============================================================
export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Düzgün email daxil edin' });
  }

  try {
    const code = await createOtp(email);
    await sendOtpEmail(email, code);

    res.json({
      success: true,
      message: 'Kod email ünvanınıza göndərildi'
    });
  } catch (err: any) {
    console.error('sendOtp xətası:', err);
    res.status(500).json({ success: false, message: 'Kod göndərilə bilmədi' });
  }
};
// ============================================================
// POST /api/auth/google
// ============================================================
export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google token tələb olunur' });
  }

  try {
    const googleUser = await verifyGoogleToken(idToken);

    // İstifadəçi var? Google ID-ni yenilə, ya yarat
    const user = await findOrCreateUser(
      googleUser.email,
      googleUser.name,
      googleUser.googleId,
      googleUser.avatarUrl
    );

    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err: any) {
    console.error('Google auth xətası:', err.message);
    res.status(401).json({ success: false, message: 'Google ilə giriş alınmadı' });
  }
};
// ============================================================
// POST /api/auth/verify-otp
// ============================================================
export const verifyOtpHandler = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email və kod tələb olunur' });
  }

  try {
    const result = await verifyOtp(email, code);

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'Kod tapılmadı və ya vaxtı bitib',
        expired: 'Kodun vaxtı bitib',
        used: 'Kod artıq istifadə olunub',
        max_attempts: 'Çox cəhd etdiniz. Yeni kod tələb edin',
        wrong_code: 'Kod yanlışdır'
      };
      return res.status(400).json({
        success: false,
        message: messages[result.reason || 'not_found'] || 'Kod yanlışdır'
      });
    }

    const user = await findOrCreateUser(email);
    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err: any) {
    console.error('verifyOtp xətası:', err);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
};

// ============================================================
// GET /api/auth/me
// ============================================================
export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Autentifikasiya olunmamısınız' });
  }

  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
    }
  });
};

// ============================================================
// POST /api/auth/logout
// ============================================================
export const logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ success: true, message: 'Çıxış edildi' });
};