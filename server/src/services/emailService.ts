import dotenv from 'dotenv';
dotenv.config();

import { Resend } from 'resend';

const FROM = `${process.env.RESEND_FROM_NAME || 'AzDatam.az'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

// Lazy Resend — yalnız funksiya çağırılanda yaranır
let resend: Resend | null = null;
const getResend = (): Resend => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY .env faylında tapılmadı');
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

export const sendOtpEmail = async (to: string, code: string): Promise<void> => {
  try {
    const client = getResend();

    const { data, error } = await client.emails.send({
      from: FROM,
      to,
      subject: `Giriş kodu: ${code}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1d29; margin-bottom: 16px;">OpenData.az</h2>
          <p style="color: #5a6470; margin-bottom: 24px;">
            Hesabınıza giriş üçün təsdiq kodu:
          </p>
          <div style="background: #f5f7fb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #0891b2;">
              ${code}
            </span>
          </div>
          <p style="color: #8b95a3; font-size: 13px;">
            Bu kod 5 dəqiqə ərzində etibarlıdır.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend xətası:', error);
      throw new Error('Email göndərilə bilmədi');
    }

    console.log(`📧 OTP email göndərildi: ${to} (id: ${data?.id})`);
  } catch (err: any) {
    console.error('❌ Email göndərmə xətası:', err.message);
    throw err;
  }
};