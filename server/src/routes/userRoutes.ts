import { Router } from 'express';
import multer from 'multer';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Multer — memory storage (kiçik fayllar üçün)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);   // ← YENİ

export default router;