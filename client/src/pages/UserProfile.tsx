import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  UserProfile as UserProfileType,
} from '../services/userApi';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileForm from '../components/profile/ProfileForm';
import { useAuth } from '../context/AuthContext'; 
type SaveState = 'idle' | 'saving' | 'success' | 'error';

const UserProfile = () => {
  const { t } = useLang();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [draft, setDraft] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const { refresh } = useAuth();                     // ← əlavə et

  useEffect(() => {
    setLoading(true);
    fetchProfile()
      .then(p => {
        setProfile(p);
        setDraft(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const isDirty =
    profile &&
    draft &&
    JSON.stringify(profile) !== JSON.stringify(draft);

  const handleChange = <K extends keyof UserProfileType>(
    key: K,
    value: UserProfileType[K]
  ) => {
    setDraft(prev => (prev ? { ...prev, [key]: value } : prev));
    setSaveState('idle');
  };

  const handleAvatarChange = async (file: File) => {
    try {
    const avatarUrl = await uploadAvatar(file);
    // həm draft, həm profile yenilə — çünki DB-də artıq dəyişib
    setProfile(prev => (prev ? { ...prev, avatarUrl } : prev));
    setDraft(prev => (prev ? { ...prev, avatarUrl } : prev));
          await refresh();                               // ← ƏLAVƏ ET

    setSaveState('idle');
  } catch (e: any) {
    setError(e.message);
    setSaveState('error');
  }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaveState('saving');
    try {
      const updated = await updateProfile(draft);
      setProfile(updated);
      setDraft(updated);
            await refresh();                    
      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e: any) {
      setError(e.message);
      setSaveState('error');
    }
  };

  const handleReset = () => {
    if (profile) setDraft(profile);
    setSaveState('idle');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-cyan" size={32} />
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-2xl mx-auto">
          <AlertCircle size={18} />
          <div>
            <div className="font-medium">{t('profile.errorTitle')}</div>
            <div className="text-xs mt-1 text-red-300/80">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Başlıq */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">
            {t('profile.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('profile.subtitle')}
          </p>
        </div>

        {/* Status bildirişi */}
        {saveState === 'success' && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle2 size={16} />
            {t('profile.savedSuccess')}
          </div>
        )}
        {saveState === 'error' && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle size={16} />
            {t('profile.saveError')}
          </div>
        )}

        {/* Header (avatar + əsas info) */}
        <ProfileHeader
          profile={draft}
          onAvatarChange={handleAvatarChange}
        />

        {/* Form */}
        <ProfileForm profile={draft} onChange={handleChange} />

        {/* Action düymələri */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={handleReset}
            disabled={!isDirty || saveState === 'saving'}
            className="px-4 py-2 rounded-lg border border-border text-sm text-gray-300 hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {t('profile.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saveState === 'saving'}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            {saveState === 'saving' && (
              <Loader2 size={14} className="animate-spin" />
            )}
            {saveState === 'saving'
              ? t('profile.saving')
              : t('profile.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;