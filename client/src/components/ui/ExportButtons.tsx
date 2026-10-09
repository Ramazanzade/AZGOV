import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, FileJson, Image, Loader2, ChevronDown, Lock } from 'lucide-react';
import { exportCSV, exportJSON, exportPNG, buildFilename } from '../../utils/exporters';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useLang } from '../../i18n/LanguageContext';

interface Props {
  title: string;
  data?: any;
  chartRef?: React.RefObject<HTMLDivElement>;
}

const ExportButtons = ({ title, data, chartRef }: Props) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLang();                                   // ← YENİ
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { open: openAuthModal } = useAuthModal();

  const handleClick = () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    setOpen(v => !v);
  };

  const handle = async (type: 'csv' | 'json' | 'png') => {
    setBusy(type);
    try {
      if (type === 'csv' && Array.isArray(data)) {
        exportCSV(data, buildFilename(title, 'csv'));
      } else if (type === 'json' && data) {
        exportJSON(data, buildFilename(title, 'json'));
      } else if (type === 'png' && chartRef?.current) {
        await exportPNG(chartRef.current, buildFilename(title, 'png'));
      }
    } finally {
      setTimeout(() => setBusy(null), 300);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition ${
          isAuthenticated
            ? 'bg-bg-card border-border text-gray-300 hover:border-accent-cyan/50 hover:text-accent-cyan'
            : 'bg-bg-card border-border text-gray-500 hover:border-accent-cyan/50'
        }`}
        title={!isAuthenticated ? t('export.loginRequired') : t('export.button')}
      >
        {isAuthenticated ? <Download size={13} /> : <Lock size={13} />}
        {t('export.button')}
        {isAuthenticated && (
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && isAuthenticated && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-bg-card border border-border shadow-xl z-50 overflow-hidden">
            <MenuItem
              icon={FileText}
              label={t('export.csv')}
              busy={busy === 'csv'}
              disabled={!Array.isArray(data)}
              onClick={() => handle('csv')}
            />
            <MenuItem
              icon={FileJson}
              label={t('export.json')}
              busy={busy === 'json'}
              disabled={!data}
              onClick={() => handle('json')}
            />
            <MenuItem
              icon={Image}
              label={t('export.png')}
              busy={busy === 'png'}
              disabled={!chartRef?.current}
              onClick={() => handle('png')}
            />
          </div>
        </>
      )}
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, disabled, busy }: any) => (
  <button
    onClick={onClick}
    disabled={disabled || busy}
    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition ${
      disabled
        ? 'text-gray-600 cursor-not-allowed'
        : 'text-gray-300 hover:bg-bg-hover hover:text-accent-cyan'
    }`}
  >
    {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
    {label}
  </button>
);

export default ExportButtons;