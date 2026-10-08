import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendOtp, verifyOtpHandler, me, logout } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// OTP göndərmək üçün rate limit — eyni IP-dən 5 dəq-də 5 sorğu
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Çox sorğu göndərdiniz. 5 dəqiqə sonra yenidən cəhd edin.' }
});

router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', verifyOtpHandler);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;