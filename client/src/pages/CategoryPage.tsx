import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useDatasets } from '../hooks/useDatasets';
import DatasetCard from '../components/dataset/DatasetCard';
import FilterPanel from '../components/layout/FilterPanel';
import { DatasetFilters, DEFAULT_FILTERS } from '../types/filters';
import { useLang } from '../i18n/LanguageContext';
import { navigation } from '../data/navigation';

const CategoryPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLang();

  const [filters, setFilters] = useState<DatasetFilters>({
    ...DEFAULT_FILTERS,
    search: searchParams.get('q') || '',
    format: searchParams.get('fmt') || 'ALL',
    organization: searchParams.get('org') || 'ALL',
    group: searchParams.get('group') || 'ALL',
    dateFrom: searchParams.get('from') || '',
    dateTo: searchParams.get('to') || ''
  });

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.q = filters.search;
    if (filters.format !== 'ALL') params.fmt = filters.format;
    if (filters.organization !== 'ALL') params.org = filters.organization;
    if (filters.group !== 'ALL') params.group = filters.group;
    if (filters.dateFrom) params.from = filters.dateFrom;
    if (filters.dateTo) params.to = filters.dateTo;
    setSearchParams(params, { replace: true });
  }, [filters]);

  const { filtered, loading, error, options } = useDatasets(filters);

  // Başlığı tərcümə et
  const pathParts = location.pathname.split('/').filter(Boolean);
  const allNavItems = navigation.flatMap(section =>
    section.items.flatMap(item => [item, ...(item.children || [])])
  );
  const lastId = pathParts[pathParts.length - 1];
  const parentId = pathParts[pathParts.length - 2];
  const navItem =
    allNavItems.find(i => i.id === lastId) ||
    allNavItems.find(i => i.id === parentId);
  const title = navItem ? t(navItem.labelKey) : lastId;

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <p className="text-sm text-gray-400">
            {loading ? t('catPage.loading') : `${filtered.length} ${t('catPage.found')}`}
          </p>
        </div>

        {/* Axtarış input */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder={t('catPage.searchPlaceholder')}
              className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-9 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-bg-card border border-border animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            {t('catPage.noResults')}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d, i) => (
              <DatasetCard key={`${d.id}-${i}`} dataset={d} />
            ))}
          </div>
        )}
      </div>

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        options={options}
      />
    </div>
  );
};

export default CategoryPage;