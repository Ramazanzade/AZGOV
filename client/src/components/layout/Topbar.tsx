import { useEffect, useState } from 'react';
import { Search, Sun, User, Command } from 'lucide-react';
import SearchModal from '../search/SearchModal';

const Topbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      // '/' ilə də aç
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
        {/* Axtarış trigger */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-3 bg-bg-primary border border-border rounded-lg pl-3 pr-20 py-2 text-sm text-gray-500 hover:border-accent-cyan/50 transition-colors text-left"
          >
            <Search size={16} />
            <span className="truncate">
              Məlumat axtar... (məs. "metro sərnişin", "iqtisadi göstəricilər")
            </span>
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
              <Command size={12} />K
            </div>
          </button>
        </div>

        {/* Sağ tərəf */}
        <div className="flex items-center gap-3 ml-6">
          <div className="flex items-center bg-bg-primary rounded-lg border border-border overflow-hidden text-xs">
            <button className="px-3 py-1.5 bg-accent-cyan/10 text-accent-cyan">AZ</button>
            <button className="px-3 py-1.5 text-gray-400 hover:text-white">RU</button>
            <button className="px-3 py-1.5 text-gray-400 hover:text-white">EN</button>
          </div>

          <button className="p-2 rounded-lg hover:bg-bg-hover text-gray-400 hover:text-white">
            <Sun size={18} />
          </button>

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