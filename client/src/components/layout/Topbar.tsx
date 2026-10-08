import { useEffect, useState } from 'react';
import { Search, Sun, Moon, User, Command } from 'lucide-react';
import SearchModal from '../search/SearchModal';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../i18n/LanguageContext';
import { Lang } from '../../i18n/translations';

const LANGS: Lang[] = ['az', 'ru', 'en'];

const Topbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === '/' && !searchOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  return (
    <>
      <header className="h-16 bg-bg-secondary border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-3 bg-bg-primary border border-border rounded-lg pl-3 pr-20 py-2 text-sm text-gray-500 hover:border-accent-cyan/50 transition-colors text-left"
          >
            <Search size={16} />
            <span className="truncate">{t('topbar.searchPlaceholder')}</span>
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
              <Command size={12} />K
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 ml-6">
          {/* Dil seçimi */}
          <div className="flex items-center bg-bg-primary rounded-lg border border-border overflow-hidden text-xs">
            {LANGS.map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 transition ${
                  lang === l
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

 {/*          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-bg-hover text-gray-400 hover:text-white transition-colors"
            title={theme === 'dark' ? t('topbar.themeLight') : t('topbar.themeDark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>  */}

          <button className="w-9 h-9 rounded-full bg-bg-primary border border-border flex items-center justify-center text-gray-400 hover:text-white">
            <User size={18} />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Topbar;