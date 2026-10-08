import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { sendOtp } from '../services/authApi';
import { useLang } from '../i18n/LanguageContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email yoxlama
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Düzgün email daxil edin');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email);
      // OTP səhifəsinə keç, email-i state-də ötür
      navigate('/login/otp', { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod göndərilə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold">
            OpenData<span className="text-accent-cyan">.az</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-bg-card border border-border p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-1">Daxil ol</h1>
            <p className="text-sm text-gray-400">
              Email ünvanınıza təsdiq kodu göndərəcəyik
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sizin@email.com"
                  disabled={loading}
                  autoFocus
                  className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 disabled:opacity-50"
                />
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Göndərilir...
                </>
              ) : (
                <>
                  Kod göndər <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-gray-500 text-center mt-6">
            Daxil olmaqla siz{' '}
            <a href="#" className="text-accent-cyan hover:underline">İstifadə şərtlərini</a>{' '}
            qəbul edirsiniz
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;