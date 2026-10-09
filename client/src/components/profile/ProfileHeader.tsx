import { useRef } from 'react';
import { Camera, Mail } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { UserProfile } from '../../services/userApi';

interface Props {
  profile: UserProfile;
  onAvatarChange: (file: File) => void;
}
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';  

const ProfileHeader = ({ profile, onAvatarChange }: Props) => {
  const { t } = useLang();

  const fileRef = useRef<HTMLInputElement>(null);
   const initials = profile.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const avatarSrc = profile.avatarUrl
  ? profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('blob:')
    ? profile.avatarUrl
    : `${API_BASE}${profile.avatarUrl}`
  : null;

{avatarSrc ? (
  <img src={avatarSrc} alt={profile.name} className="..." />
) : (
  <div className="...">{initials}</div>
)}


 const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarChange(file);
    e.target.value = ''; // eyni faylı yenidən seçmək mümkün olsun
  };

  return (
    <div className="rounded-xl bg-bg-card border border-border p-6 mb-6 flex items-center gap-5">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-bg-primary border border-border flex items-center justify-center text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition"
          title={t('profile.changeAvatar')}
          aria-label={t('profile.changeAvatar')}
        >
          <Camera size={14} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* Ad + email */}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-gray-100 truncate">
          {profile.name}
        </h2>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
          <Mail size={13} />
          <span className="truncate">{profile.email}</span>
        </div>
        {profile.organization && (
          <div className="text-xs text-gray-500 mt-1">
            {profile.position && `${profile.position} · `}
            {profile.organization}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;