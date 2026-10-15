import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, X } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { useGroupedNavigation } from '../../hooks/useGroupedNavigation';

const Sidebar = () => {
  const { t } = useLang();
  const location = useLocation();
  const { groups } = useGroupedNavigation();
  const [query, setQuery] = useState('');
const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
const toggleGroup = (id: string) => {
  setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
};
  // Flat filter — hər qrupun kateqoriyalarını query-yə görə yoxla
  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return groups;
    return groups
      .map(g => ({
        ...g,
        categories: g.categories.filter(c =>
          c.name.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.categories.length > 0);
  }, [groups, query]);

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col">
      {/* Logo */}
      <NavLink
        to="/"
        className="h-16 flex items-center px-5 border-b border-border flex-shrink-0 hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold">
            AzDatam<span className="text-accent-cyan">.az</span>
          </span>
        </div>
      </NavLink>

      {/* Axtarış */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-bg-primary border border-border rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Yastı naviqasiya */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 py-2">
          Məlumat Kateqoriyaları
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center text-[11px] text-gray-500 py-8">
            {t('nav.noResults')}
          </div>
        )}

      {filteredGroups.map(group => {
  const isOpen = !!openGroups[group.id] || !!query.trim();
  return (
    <div key={group.id} className="mb-1">
      {/* Qrup başlığı — kliklənə bilər */}
      <button
        onClick={() => toggleGroup(group.id)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider font-semibold transition-colors ${
          isOpen
            ? 'text-accent-cyan bg-accent-cyan/5'
            : 'text-gray-400 hover:text-white hover:bg-bg-hover'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
           {group.label}
        </span>
        <span
          className={`text-[9px] transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
        >
          ▶
        </span>
      </button>

      {/* Kateqoriyalar */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-3 pl-2 border-l border-border space-y-0.5">
          {group.categories.map(cat => {
            const path = `/browse/${group.id}/${cat.id}`;
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={cat.id}
                to={path}
                className={`block px-2 py-1.5 rounded text-[12px] transition-colors ${
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-gray-400 hover:bg-bg-hover hover:text-white'
                }`}
              >
                {cat.name.replace(/^\d+\s*/, '')}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
})}
      </nav>
    </aside>
  );
};

export default Sidebar;