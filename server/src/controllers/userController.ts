import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as userService from '../services/userService';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto'; 
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const MAX_SIZE = 5 * 1024 * 1024;   // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadAvatar(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autentifikasiya tələb olunur' });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Fayl göndərilmədi' });
    }

    if (!ALLOWED.includes(file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Yalnız şəkil faylları qəbul olunur' });
    }
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, message: 'Fayl 5MB-dan böyükdür' });
    }

    // Qovluq yarat (yoxdursa)
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Unikal fayl adı
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${userId}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filepath, file.buffer);

    // Public URL
    const avatarUrl = `/uploads/avatars/${filename}`;

    const updated = await userService.updateAvatar(userId, avatarUrl);

    return res.json({
      success: true,
      data: { avatarUrl, user: userService.toPublic(updated) },
    });
  } catch (e: any) {
    console.error('[uploadAvatar]', e);
    return res.status(500).json({ success: false, message: 'Server xətası' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;              // ← DÜZGÜN SAHƏ
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autentifikasiya tələb olunur' });
    }

    const user = await userService.getById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    return res.json({ success: true, data: userService.toPublic(user) });
  } catch (e: any) {
    console.error('[getMe]', e);
    return res.status(500).json({ success: false, message: 'Server xətası' });
  }
}

export async function updateMe(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autentifikasiya tələb olunur' });
    }

    const { name, email, phone, organization, position, bio, language, avatarUrl } = req.body;

    // Validasiya
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return res.status(400).json({ success: false, message: 'Ad çox qısadır' });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'E-poçt yanlışdır' });
    }
    if (language !== undefined && !['az', 'ru', 'en'].includes(language)) {
      return res.status(400).json({ success: false, message: 'Dil yanlışdır' });
    }

    const updated = await userService.update(userId, {
      name, email, phone, organization, position, bio, language, avatarUrl,
    });

    return res.json({ success: true, data: userService.toPublic(updated) });
  } catch (e: any) {
    console.error('[updateMe]', e);
    if (e.code === '23505') {
      return res.status(409).json({ success: false, message: 'Bu e-poçt artıq istifadə olunur' });
    }
    return res.status(500).json({ success: false, message: 'Server xətası' });
  }
}