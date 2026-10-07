import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, FileText, Map as MapIcon,
  TrendingUp, Users, Leaf, Globe, ArrowRight,
  Sparkles, Code2
} from 'lucide-react';
import { useDatasets } from '../hooks/useDatasets';
import { useLang } from '../i18n/LanguageContext';

const CATEGORY_ICONS: Record<string, any> = {
  economy: TrendingUp,
  population: Users,
  labor: Users,
  education: FileText,
  health: FileText,
  environment: Leaf,
  geo: MapIcon,
  transport: MapIcon,
  metro: MapIcon,
  tourism: Globe,
  regional: Globe,
  other: Database,
  
};

const CATEGORY_LABELS: Record<string, string> = {
 economy: 'cat.economy',
  population: 'cat.population',
  labor: 'cat.labor',
  education: 'cat.education',
  health: 'cat.health',
  environment: 'cat.environment',
  geo: 'cat.geo',
  transport: 'cat.transport',
  metro: 'cat.metro',
  tourism: 'cat.tourism',
  regional: 'cat.regional',
  other: 'cat.other',
  crime: 'cat.crime',
  sport: 'cat.sport',
  culture: 'cat.culture',
  industry: 'cat.industry',
  agriculture: 'cat.agriculture',
  energy: 'cat.energy',
  trade: 'cat.trade',
};

const CATEGORY_PATHS: Record<string, string> = {
  economy: '/dashboard/economy/transport',
  population: '/dashboard/demographic/population',
  labor: '/dashboard/demographic/labor',
  education: '/dashboard/demographic/education',
  health: '/dashboard/demographic/health',
  environment: '/dashboard/environment/ecology',
  geo: '/dashboard/geo/maps',
  transport: '/dashboard/economy/transport',
  metro: '/dashboard/metro',
  tourism: '/dashboard/economy/tourism',
  regional: '/dashboard/environment/regions',
  other: '/dashboard/economy/transport'
};

const HomePage = () => {
  const { datasets, loading } = useDatasets();
const { t } = useLang();

  // Statistika hesablanır
  const stats = useMemo(() => {
    const byFormat: Record<string, number> = {};
    const byGroup: Record<string, number> = {};
    const byOrg = new Set<string>();

    datasets.forEach(d => {
      byFormat[d.format] = (byFormat[d.format] || 0) + 1;
      byGroup[d.group] = (byGroup[d.group] || 0) + 1;
      byOrg.add(d.organization);
    });

    return {
      total: datasets.length,
      formats: byFormat,
      groups: byGroup,
      orgCount: byOrg.size
    };
  }, [datasets]);

  // Top kateqoriyalar
  const topCategories = useMemo(() => {
    return Object.entries(stats.groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key, count]) => ({ key, count }));
  }, [stats.groups]);

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
         <h1>{t('home.title')}</h1>
<p>{t('home.subtitle')}</p>
          <Sparkles size={24} className="text-accent-cyan" />
        </div>
        <p className="text-sm text-gray-400 max-w-2xl">
          {t('common.datasets1')}
        </p>
      </div>

      {/* Ümumi statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={Database}
          label={t('home.totalDatasets')}
          value={loading ? '...' : stats.total.toLocaleString('az')}
          color="cyan"
        />
        <StatBox
          icon={FileText}
          label={t('home.formatTypes')}
          value={loading ? '...' : Object.keys(stats.formats).length}
          color="purple"
        />
        <StatBox
          icon={Users}
          label={t('home.organizations')}
          value={loading ? '...' : stats.orgCount}
          color="pink"
        />
        <StatBox
          icon={TrendingUp}
          label={t('home.biggestCategory')}
          value={
            loading || topCategories.length === 0
              ? '...'
              :  t(CATEGORY_LABELS[topCategories[0].key] as any) || topCategories[0].key
          }
          color="blue"
          small
        />
      </div>

      {/* Kateqoriyalar grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('home.categoriesTitle')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {topCategories.map(({ key, count }) => {
            const Icon = CATEGORY_ICONS[key] || Database;
            const path = CATEGORY_PATHS[key] || '/dashboard/economy/transport';
            return (
              <Link
                key={key}
                to={path}
                className="group rounded-xl bg-bg-card border border-border p-4 hover:border-accent-cyan/50 hover:bg-bg-hover transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 flex items-center justify-center">
                    <Icon size={18} className="text-accent-cyan" />
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-600 group-hover:text-accent-cyan group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <div className="text-sm font-semibold text-gray-100 mb-1">
  {t(CATEGORY_LABELS[key] as any) || key}
                </div>
                <div className="text-[11px] text-gray-500">
                  {count} dataset
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Formatlar + API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formatlar */}
        <div className="rounded-xl bg-bg-card border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">{t('home.byFormat')}</h3>
          <div className="space-y-3">
            {Object.entries(stats.formats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([fmt, count]) => {
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={fmt}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-gray-300">{fmt}</span>
                      <span className="text-gray-500">
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-primary overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Developer */}
        <div className="rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 border border-accent-cyan/20 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={18} className="text-accent-cyan" />
            <h3 className="text-sm font-semibold">{t('nav.developer')}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4 flex-1">
           {t('common.datasets2')}
          </p>
          <Link
            to="/developer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/25 transition w-fit"
          >
            API Docs <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ---------- Alt komponent ----------

interface StatBoxProps {
  icon: any;
  label: string;
  value: string | number;
  color: 'cyan' | 'purple' | 'pink' | 'blue';
  small?: boolean;
}

const colorMap = {
  cyan: 'from-accent-cyan/20 to-accent-cyan/5 text-accent-cyan border-accent-cyan/30',
  purple: 'from-accent-purple/20 to-accent-purple/5 text-accent-purple border-accent-purple/30',
  pink: 'from-accent-pink/20 to-accent-pink/5 text-accent-pink border-accent-pink/30',
  blue: 'from-accent-blue/20 to-accent-blue/5 text-accent-blue border-accent-blue/30'
};

const StatBox = ({ icon: Icon, label, value, color, small }: StatBoxProps) => {
  const c = colorMap[color].split(' ');
  return (
    <div className={`rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} border ${c[2]} p-4`}>
      <div className={`w-8 h-8 rounded-lg bg-bg-primary/50 flex items-center justify-center ${c[3]} mb-2`}>
        <Icon size={16} />
      </div>
      <div className="text-[11px] text-gray-400 uppercase tracking-wide truncate">
        {label}
      </div>
      <div className={`mt-1 font-bold ${c[3]} ${small ? 'text-sm' : 'text-xl'}`}>
        {value}
      </div>
    </div>
  );
};

export default HomePage;