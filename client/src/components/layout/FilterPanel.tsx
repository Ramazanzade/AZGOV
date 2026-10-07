import { SlidersHorizontal, RotateCcw, Filter, X } from 'lucide-react';
import { DatasetFilters, DEFAULT_FILTERS } from '../../types/filters';
import { groupKey } from '../../utils/columnLabels';
import { useLang } from '../../i18n/LanguageContext';

interface Props {
  filters: DatasetFilters;
  onChange: (f: DatasetFilters) => void;
  options: {
    organizations: string[];
    groups: string[];
    formats: string[];
  };
  onApply?: () => void;
  showApplyButton?: boolean;
}

const FilterPanel = ({ filters, onChange, options, onApply, showApplyButton = false }: Props) => {
  const { t } = useLang();

  const update = <K extends keyof DatasetFilters>(key: K, value: DatasetFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const reset = () => onChange({ ...DEFAULT_FILTERS });

  const activeCount = [
    filters.format !== 'ALL',
    filters.organization !== 'ALL',
    filters.group !== 'ALL',
    !!filters.dateFrom,
    !!filters.dateTo
  ].filter(Boolean).length;

  return (
    <aside className="w-72 bg-bg-secondary border-l border-border p-4 overflow-y-auto flex-shrink-0">
      {/* Başlıq */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-400" />
          <span className="font-semibold text-sm">{t('filter.title')}</span>
          {activeCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-accent-cyan flex items-center gap-1"
        >
          <RotateCcw size={12} /> {t('filter.reset')}
        </button>
      </div>

      {/* Tarix aralığı */}
      <Section title={t('filter.dateRange')}>
        <div className="space-y-2">
          <div className="relative">
            <label className="absolute -top-1.5 left-2 px-1 text-[9px] bg-bg-secondary text-gray-500">
              {t('filter.dateFrom')}
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => update('dateFrom', e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-accent-cyan/50"
            />
          </div>
          <div className="relative">
            <label className="absolute -top-1.5 left-2 px-1 text-[9px] bg-bg-secondary text-gray-500">
              {t('filter.dateTo')}
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => update('dateTo', e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-accent-cyan/50"
            />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => { update('dateFrom', ''); update('dateTo', ''); }}
              className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1"
            >
              <X size={10} /> {t('filter.clearDate')}
            </button>
          )}
        </div>
      </Section>

      {/* Kateqoriya (group) */}
      <Section title={t('filter.category')}>
        <select
          value={filters.group}
          onChange={e => update('group', e.target.value)}
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-accent-cyan/50"
        >
          <option value="ALL">{t('filter.all')}</option>
          {options.groups.map(g => (
            <option key={g} value={g}>{t(groupKey(g))}</option>
          ))}
        </select>
      </Section>

      {/* Mənbə (təşkilat) */}
      <Section title={t('filter.source')}>
        <select
          value={filters.organization}
          onChange={e => update('organization', e.target.value)}
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-accent-cyan/50"
        >
          <option value="ALL">{t('filter.allSources')}</option>
          {options.organizations.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Section>

      {/* Format */}
      <Section title={t('filter.format')}>
        <div className="flex flex-wrap gap-1.5">
          <FormatChip
            active={filters.format === 'ALL'}
            onClick={() => update('format', 'ALL')}
          >
            {t('filter.all')}
          </FormatChip>
          {options.formats.map(f => (
            <FormatChip
              key={f}
              active={filters.format === f}
              onClick={() => update('format', f)}
            >
              {f}
            </FormatChip>
          ))}
        </div>
      </Section>

      {/* Tətbiq et */}
      {showApplyButton && onApply && (
        <button
          onClick={onApply}
          className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
        >
          <Filter size={14} /> {t('filter.apply')}
        </button>
      )}

      {/* API Access */}
      <div className="mt-6 p-3 rounded-lg bg-bg-primary border border-border">
        <div className="text-xs text-gray-400 mb-1">{t('filter.apiAccess')}</div>
        <div className="text-[10px] text-gray-500 mb-2">JSON, CSV, GeoJSON</div>
        <button className="text-xs text-accent-cyan hover:underline">
          {t('filter.apiDocs')} →
        </button>
      </div>
    </aside>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-xs text-gray-400 mb-1.5">{title}</label>
    {children}
  </div>
);

const FormatChip = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition ${
      active
        ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan'
        : 'bg-bg-primary border-border text-gray-400 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export default FilterPanel;