import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { verifyOtp, sendOtp } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // saniyə

const OtpVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const email = (location.state as any)?.email as string | undefined;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Email yoxdursa login səhifəsinə qaytar
  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  // İlk input-a fokus
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    // Yalnız rəqəm
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Növbəti input-a keç
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Bütün rəqəmlər doldusa → avtomatik submit
    if (digit && index === OTP_LENGTH - 1 && newDigits.every(d => d)) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newDigits = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((d, i) => { if (i < OTP_LENGTH) newDigits[i] = d; });
      setDigits(newDigits);
      if (pasted.length === OTP_LENGTH) {
        handleVerify(pasted);
      } else {
        inputsRef.current[pasted.length]?.focus();
      }
    }
  };

  const handleVerify = async (code: string) => {
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      const user = await verifyOtp(email, code);
      setUser(user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod yanlışdır');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError(null);
    try {
      await sendOtp(email);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod göndərilə bilmədi');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-cyan mb-6"
        >
          <ArrowLeft size={12} /> Geri
        </Link>

        <div className="rounded-2xl bg-bg-card border border-border p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-1">Təsdiq kodu</h1>
            <p className="text-sm text-gray-400">
              6 rəqəmli kod göndərildi:
            </p>
            <p className="text-xs text-accent-cyan mt-1 break-all">{email}</p>
          </div>

          {/* 6 input */}
          <div className="flex justify-center gap-2 mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold bg-bg-primary border border-border rounded-lg text-gray-100 focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20 transition disabled:opacity-50"
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-accent-cyan text-sm mb-4">
              <Loader2 size={14} className="animate-spin" /> Yoxlanılır...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-4">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={() => handleVerify(digits.join(''))}
            disabled={loading || digits.some(d => !d)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Təsdiq et
          </button>

          {/* Yenidən göndər */}
          <div className="text-center mt-6">
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-cyan transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} className={cooldown > 0 ? '' : 'group-hover:rotate-180 transition-transform'} />
              {cooldown > 0 ? `Yenidən göndər (${cooldown}s)` : 'Kodu yenidən göndər'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;