import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendOtp, verifyOtpHandler, me, logout,verifySignup } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';
import { googleAuth, register, login } from '../controllers/authController';

const router = Router();

// OTP göndərmək üçün rate limit — eyni IP-dən 5 dəq-də 5 sorğu
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Çox sorğu göndərdiniz. 5 dəqiqə sonra yenidən cəhd edin.' }
});
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', verifyOtpHandler);
router.post('/register', register);
router.post('/verify-signup', verifySignup);      // ← YENİ

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/logout', logout);
router.post('/google', googleAuth);

export default router;