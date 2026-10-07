import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Search, X } from 'lucide-react';
import { navigation, NavItem } from '../../data/navigation';
import { useStats } from '../../hooks/useStats';
import { useLang } from '../../i18n/LanguageContext';

const Sidebar = () => {
  const { t } = useLang();          // ✅ Hook is now inside the component
  const location = useLocation();
  const stats = useStats();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  // URL dəyişəndə aktiv kateqoriyanı aç
  useEffect(() => {
    const newOpen: Record<string, boolean> = {};
    navigation.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const isChildActive = item.children.some(
            child => child.path && location.pathname.startsWith(child.path)
          );
          if (isChildActive) newOpen[item.id] = true;
        }
      });
    });
    setOpenItems(prev => ({ ...prev, ...newOpen }));
  }, [location.pathname]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Axtarış filtri
  const filteredNavigation = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return navigation;

    return navigation
      .map(section => {
        const items = section.items
          .map(item => {
            if (item.children) {
              const matchingChildren = item.children.filter(c => {
                const label = t(c.labelKey);
                return (
                  label.toLowerCase().includes(q) ||
                  (c.path && c.path.toLowerCase().includes(q))
                );
              });
              if (matchingChildren.length > 0) return { ...item, children: matchingChildren };
              if (t(item.labelKey).toLowerCase().includes(q)) return item;
              return null;
            }
            return t(item.labelKey).toLowerCase().includes(q) ? item : null;
          })
          .filter((x): x is NavItem => x !== null);
        return { ...section, items };
      })
      .filter(section => section.items.length > 0);
  }, [query, t]);

  // Axtarış aktivdirsə bütün kateqoriyaları aç
  useEffect(() => {
    if (query.trim()) {
      const allOpen: Record<string, boolean> = {};
      navigation.forEach(section => {
        section.items.forEach(item => {
          if (item.children) allOpen[item.id] = true;
        });
      });
      setOpenItems(allOpen);
    }
  }, [query]);

  const getCount = (id: string): number => {
    if (!stats) return 0;
    const map: Record<string, string[]> = {
      demographic: ['population', 'labor', 'education', 'health', 'crime'],
      economy: ['economy'],
      environment: ['environment'],
      geo: ['geo', 'map'],
    };
    const groups = map[id] || [];
    return groups.reduce((sum, g) => sum + (stats.byGroup[g] || 0), 0);
  };

  const hasResults = filteredNavigation.length > 0;

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col">
      <NavLink
        to="/"
        className="h-16 flex items-center px-5 border-b border-border flex-shrink-0 hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold">
            OpenData<span className="text-accent-cyan">.az</span>
          </span>
        </div>
      </NavLink>

      {/* Axtarış input-u */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
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

      {/* Naviqasiya */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        {!hasResults && (
          <div className="text-center text-[11px] text-gray-500 py-8">
            {t('nav.noResults')}
          </div>
        )}

        {filteredNavigation.map(section => (
          <div key={section.id}>
            {section.titleKey && (
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 mb-2">
                {t(section.titleKey)}
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItemRenderer
                  key={item.id}
                  item={item}
                  isOpen={!!openItems[item.id] || !!query.trim()}
                  onToggle={toggleItem}
                  currentPath={location.pathname}
                  count={getCount(item.id)}
                  highlight={query.trim()}
                  t={t}                   
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

// ---------- Alt komponentlər ----------
type TFunction = ReturnType<typeof useLang>['t'];
interface NavItemRendererProps {
  item: NavItem;
  isOpen: boolean;
  onToggle: (id: string) => void;
  currentPath: string;
  depth?: number;
  count?: number;
  highlight?: string;
t: TFunction;
}

const HighlightText = ({ text, query }: { text: string; query?: string }) => {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-accent-cyan/20 text-accent-cyan rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
};

const NavItemRenderer = ({
  item,
  isOpen,
  onToggle,
  currentPath,
  depth = 0,
  count,
  highlight,
  t,                                // ← t-ni destructure edirik
}: NavItemRendererProps) => {
  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    const isAnyChildActive = item.children.some(
      child => child.path && currentPath.startsWith(child.path)
    );

    return (
      <div>
        <button
          onClick={() => onToggle(item.id)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            isAnyChildActive
              ? 'text-accent-cyan'
              : 'text-gray-400 hover:bg-bg-hover hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {Icon && <Icon size={16} className="flex-shrink-0" />}
            <span className="truncate text-left text-[13px]">
              <HighlightText text={t(item.labelKey)} query={highlight} />
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {count !== undefined && count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-gray-500">
                {count}
              </span>
            )}
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            />
          </div>
        </button>

        <div
          className={`overflow-hidden transition-all duration-200 ${
            isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="ml-4 pl-3 border-l border-border space-y-0.5">
            {item.children.map(child => (
              <NavItemRenderer
                key={child.id}
                item={child}
                isOpen={isOpen}
                onToggle={onToggle}
                currentPath={currentPath}
                depth={depth + 1}
                highlight={highlight}
                t={t}                     // ← uşaqlara da ötürürük
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '#'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
          isActive
            ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
            : 'text-gray-400 hover:bg-bg-hover hover:text-white'
        }`
      }
    >
      {Icon && <Icon size={16} className="flex-shrink-0" />}
      <span className="truncate text-[13px]">
        <HighlightText text={t(item.labelKey)} query={highlight} />
      </span>
    </NavLink>
  );
};

export default Sidebar;