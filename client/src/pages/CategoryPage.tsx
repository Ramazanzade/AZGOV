import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { useDatasets } from '../hooks/useDatasets';
import DatasetCard from '../components/dataset/DatasetCard';

const CategoryPage = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');

  const { filtered, loading, error } = useDatasets(search, formatFilter);
  const pathParts = location.pathname.split('/').filter(Boolean);
  const title = pathParts[pathParts.length - 1] || 'Məlumatlar';

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold capitalize mb-1">{title}</h1>
        <p className="text-sm text-gray-400">
          OpenData.az üzrə {filtered.length} dataset tapıldı
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Dataset axtar..."
            className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50" />
        </div>

        <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg px-1 py-1">
          <Filter size={12} className="text-gray-500 ml-2" />
          {['ALL', 'CSV', 'JSON', 'GEOJSON', 'XLSX'].map(f => (
            <button key={f} onClick={() => setFormatFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                formatFilter === f ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-gray-400 hover:text-white'
              }`}>
              {f === 'ALL' ? 'Hamısı' : f}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-bg-card border border-border animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">Nəticə tapılmadı</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(d => (
            <DatasetCard key={d.id} dataset={d} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;