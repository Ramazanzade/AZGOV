import { useLang } from '../../i18n/LanguageContext';
import { UserProfile } from '../../services/userApi';

interface Props {
  profile: UserProfile;
  onChange: <K extends keyof UserProfile>(
    key: K,
    value: UserProfile[K]
  ) => void;
}

const ProfileForm = ({ profile, onChange }: Props) => {
  const { t } = useLang();

  return (
    <div className="rounded-xl bg-bg-card border border-border p-6 space-y-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-2">
        {t('profile.personalInfo')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label={t('profile.fields.name')}
          value={profile.name}
          onChange={v => onChange('name', v)}
        />
        <Field
          label={t('profile.fields.email')}
          type="email"
          value={profile.email}
          onChange={v => onChange('email', v)}
        />
        <Field
          label={t('profile.fields.phone')}
          type="tel"
          value={profile.phone || ''}
          onChange={v => onChange('phone', v)}
          placeholder="+994 __ ___ __ __"
        />
        <Field
          label={t('profile.fields.organization')}
          value={profile.organization || ''}
          onChange={v => onChange('organization', v)}
        />
        <Field
          label={t('profile.fields.position')}
          value={profile.position || ''}
          onChange={v => onChange('position', v)}
        />
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            {t('profile.fields.language')}
          </label>
          <select
            value={profile.language}
            onChange={e =>
              onChange('language', e.target.value as UserProfile['language'])
            }
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-cyan/50"
          >
            <option value="az">Azərbaycan</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          {t('profile.fields.bio')}
        </label>
        <textarea
          value={profile.bio || ''}
          onChange={e => onChange('bio', e.target.value)}
          rows={4}
          maxLength={300}
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-cyan/50 resize-none"
          placeholder={t('profile.fields.bioPlaceholder')}
        />
        <div className="text-[10px] text-gray-500 mt-1 text-right">
          {(profile.bio || '').length} / 300
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-cyan/50"
    />
  </div>
);

export default ProfileForm;