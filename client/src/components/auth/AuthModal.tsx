import { useEffect, useRef, useState } from 'react';
import {
  X, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2,
  AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import {
  loginWithPassword,
  registerUser,
  verifySignup,
  googleAuth,
  sendOtp
} from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useLang } from '../../i18n/LanguageContext';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

type Step = 'form' | 'otp';

const AuthModal = () => {
  const { mode, close, switchMode } = useAuthModal();
  const { setUser } = useAuth();
  const { t } = useLang();                                  // ← YENİ

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Modal açılanda reset
  useEffect(() => {
    if (mode) {
      setStep('form');
      setEmail('');
      setPassword('');
      setName('');
      setShowPassword(false);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError(null);
      setCooldown(0);
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [mode]);

  // OTP addımında ilk input fokus
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [step]);

  // ESC bağla
  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, close]);

  // Cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // ============================================================
  // FORM SUBMIT (signup və ya signin)
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.errorEmailInvalid'));
      return;
    }
    if (!password || password.length < 6) {
      setError(t('auth.errorPasswordShort'));
      return;
    }
    if (mode === 'signup' && (!name || name.trim().length < 2)) {
      setError(t('auth.errorNameShort'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await registerUser(email, password, name.trim());
        if (res.needsVerification) {
          setStep('otp');
          setCooldown(RESEND_COOLDOWN);
          setDigits(Array(OTP_LENGTH).fill(''));
        }
      } else {
        const user = await loginWithPassword(email, password);
        setUser(user);
        close();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OTP VERIFY
  // ============================================================
  const handleVerify = async (code?: string) => {
    const finalCode = code || digits.join('');
    if (finalCode.length !== OTP_LENGTH) return;

    setError(null);
    setLoading(true);
    try {
      const user = await verifySignup(email, finalCode);
      setUser(user);
      close();
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.errorCodeWrong'));
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OTP YENİDƏN GÖNDƏR
  // ============================================================
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      await sendOtp(email);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.errorCodeSend'));
    }
  };

  // ============================================================
  // OTP input handlers
  // ============================================================
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1 && next.every(d => d)) {
      handleVerify(next.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { if (i < OTP_LENGTH) next[i] = d; });
    setDigits(next);
    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted);
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  };

  // ============================================================
  // GOOGLE
  // ============================================================
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    try {
      const user = await googleAuth(credentialResponse.credential);
      setUser(user);
      close();
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.googleError'));
    } finally {
      setLoading(false);
    }
  };

  if (!mode) return null;

  const isSignup = mode === 'signup';
  const isOtpStep = step === 'otp';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bg-card border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ==================== OTP STEP ==================== */}
        {isOtpStep ? (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div>
                <h2 className="text-lg font-bold">{t('auth.otpTitle')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('auth.otpSubtitle')}
                </p>
              </div>
              <button
                onClick={close}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-hover transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-4">
              <button
                onClick={() => { setStep('form'); setError(null); }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-cyan mb-4"
              >
                <ArrowLeft size={12} /> {t('auth.back')}
              </button>

              <div className="text-center mb-5">
                <p className="text-xs text-gray-400 mb-1">{t('auth.otpSent')}</p>
                <p className="text-sm text-accent-cyan break-all">{email}</p>
              </div>

              <div className="flex justify-center gap-2 mb-5">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className="w-11 h-14 text-center text-2xl font-bold bg-bg-primary border border-border rounded-lg text-gray-100 focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20 transition disabled:opacity-50"
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-accent-cyan text-sm mb-4">
                  <Loader2 size={14} className="animate-spin" /> {t('auth.verifying')}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-4">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => handleVerify()}
                disabled={loading || digits.some(d => !d)}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('auth.submitVerify')}
              </button>

              <div className="text-center mt-5">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-cyan transition disabled:opacity-50"
                >
                  <RefreshCw size={12} />
                  {cooldown > 0
                    ? `${t('auth.resendIn')} (${cooldown}s)`
                    : t('auth.resend')}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ==================== FORM STEP ==================== */
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div>
                <h2 className="text-lg font-bold">
                  {isSignup ? t('auth.signup') : t('auth.signin')}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isSignup ? t('auth.signupSubtitle') : t('auth.signinSubtitle')}
                </p>
              </div>
              <button
                onClick={close}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-hover transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError(t('auth.googleError'))}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {t('auth.or')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {isSignup && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      {t('auth.name')}
                    </label>
                    <div className="relative">
                      <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('auth.namePlaceholder')}
                        disabled={loading}
                        className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
                      disabled={loading}
                      autoComplete="email"
                      className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={
                        isSignup
                          ? t('auth.passwordPlaceholder')
                          : t('auth.passwordLoginPlaceholder')
                      }
                      disabled={loading}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    isSignup ? t('auth.submitSignup') : t('auth.submitSignin')
                  )}
                </button>
              </form>

              <div className="text-center mt-5 text-xs text-gray-400">
                {isSignup ? (
                  <>
                    {t('auth.haveAccount')}{' '}
                    <button
                      onClick={() => switchMode('signin')}
                      className="text-accent-cyan hover:underline font-medium"
                    >
                      {t('auth.goSignin')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('auth.noAccount')}{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      className="text-accent-cyan hover:underline font-medium"
                    >
                      {t('auth.goSignup')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 text-center">
              <p className="text-[11px] text-gray-500">
                {t('auth.terms')}{' '}
                <a href="#" className="text-accent-cyan hover:underline">
                  {t('auth.termsLink')}
                </a>{' '}
                {t('auth.termsEnd')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;