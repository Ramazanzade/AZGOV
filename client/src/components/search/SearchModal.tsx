import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Database, FileText, Map as MapIcon,
  Building2, FolderTree, ArrowRight, Command
} from 'lucide-react';
import { useDatasets } from '../../hooks/useDatasets';
import { niceName } from '../../utils/columnLabels';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Result =
  | { type: 'dataset'; id: string; title: string; org: string; format: string }
  | { type: 'org'; name: string; count: number }
  | { type: 'group'; name: string; count: number };

const formatIcon = (fmt: string) => {
  if (fmt === 'GEOJSON') return <MapIcon size={12} />;
  if (fmt === 'JSON') return <FileText size={12} />;
  return <Database size={12} />;
};

const SearchModal = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { datasets } = useDatasets();

  // Açılanda input focus
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Esc ilə bağla
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Nəticələr
  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const items: Result[] = [];

    // 1. Dataset-lər (max 6)
    const matchedDatasets = datasets
      .filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.organization.toLowerCase().includes(q)
      )
      .slice(0, 6);
    matchedDatasets.forEach(d => items.push({
      type: 'dataset', id: d.id, title: d.title, org: d.organization, format: d.format
    }));

    // 2. Təşkilatlar (max 3)
    const orgs = new Map<string, number>();
    datasets.forEach(d => {
      if (d.organization.toLowerCase().includes(q)) {
        orgs.set(d.organization, (orgs.get(d.organization) || 0) + 1);
      }
    });
    Array.from(orgs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([name, count]) => items.push({ type: 'org', name, count }));

    // 3. Qruplar (max 3)
    const groups = new Map<string, number>();
    datasets.forEach(d => {
      if (d.group && d.group.toLowerCase().includes(q)) {
        groups.set(d.group, (groups.get(d.group) || 0) + 1);
      }
    });
    Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([name, count]) => items.push({ type: 'group', name, count }));

    return items;
  }, [query, datasets]);

  const handleSelect = (r: Result) => {
    if (r.type === 'dataset') {
      // Dataset səhifəsinə keç — dataset-i state-də ötür
      const ds = datasets.find(d => d.id === r.id);
      navigate(`/dataset/${r.id}`, { state: { dataset: ds } });
    } else if (r.type === 'org') {
      // Təşkilat üzrə bütün dataset-lər — CategoryPage-ə filter ilə get
      navigate(`/dashboard/economy/transport?org=${encodeURIComponent(r.name)}`);
    } else {
      navigate(`/dashboard/${r.name}`);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-xl bg-bg-secondary border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Dataset, təşkilat və ya kateqoriya axtar..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          ) : (
            <kbd className="text-[10px] px-2 py-0.5 rounded bg-bg-primary border border-border text-gray-500">
              ESC
            </kbd>
          )}
        </div>

        {/* Nəticələr */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="px-4 py-8 text-center text-xs text-gray-500">
              Yazmağa başla — canlı nəticə görünəcək
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-500">
              "<span className="text-gray-300">{query}</span>" üçün nəticə tapılmadı
            </div>
          )}

          {results.map((r, i) => (
            <button
              key={`${r.type}-${i}`}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors text-left border-b border-border/50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-bg-primary border border-border flex items-center justify-center flex-shrink-0">
                {r.type === 'dataset' && <Database size={14} className="text-accent-cyan" />}
                {r.type === 'org' && <Building2 size={14} className="text-accent-purple" />}
                {r.type === 'group' && <FolderTree size={14} className="text-accent-pink" />}
              </div>

              <div className="flex-1 min-w-0">
                {r.type === 'dataset' && (
                  <>
                    <div className="text-sm text-gray-200 truncate">{r.title}</div>
                    <div className="text-[10px] text-gray-500 truncate flex items-center gap-2">
                      <span>{r.org}</span>
                      <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border flex items-center gap-1">
                        {formatIcon(r.format)}
                        {r.format}
                      </span>
                    </div>
                  </>
                )}
                {r.type === 'org' && (
                  <>
                    <div className="text-sm text-gray-200">{r.name}</div>
                    <div className="text-[10px] text-gray-500">{r.count} dataset</div>
                  </>
                )}
                {r.type === 'group' && (
                  <>
                    <div className="text-sm text-gray-200">{niceName(r.name)}</div>
                    <div className="text-[10px] text-gray-500">{r.count} dataset</div>
                  </>
                )}
              </div>

              <ArrowRight size={14} className="text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-gray-500">
          <span>{results.length} nəticə</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-bg-primary border border-border">↵</kbd>
              Aç
            </span>
            <span className="flex items-center gap-1">
              <Command size={10} />K
              Aç / Bağla
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;