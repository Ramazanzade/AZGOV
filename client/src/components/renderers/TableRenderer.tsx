import { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Database } from 'lucide-react';
import { niceName } from '../../utils/columnLabels';
import { useLang } from '../../i18n/LanguageContext';

interface Props { data: any[] }

const TableRenderer = ({ data }: Props) => {
  const { t } = useLang();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Database size={32} className="mb-3 opacity-40" />
        <div className="text-sm">{t('detail.noData')}</div>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const sortedRows = useMemo(() => {
    const rows = data.slice(0, 200);
    if (!sortKey) return rows;

    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = Number(String(av ?? '').replace(/[^\d.-]/g, ''));
      const bn = Number(String(bv ?? '').replace(/[^\d.-]/g, ''));
      const isNum = !isNaN(an) && !isNaN(bn) && av !== '' && bv !== '';

      let cmp: number;
      if (isNum) cmp = an - bn;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'az');

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (col: string) => {
    if (sortKey === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-bg-card">
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-bg-secondary sticky top-0 z-10">
            <tr>
              {columns.map(col => {
                const isActive = sortKey === col;
                const SortIcon = !isActive ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    title={col}
                    className={`text-left px-3 py-2.5 font-semibold border-b border-border whitespace-nowrap
                                cursor-pointer select-none group/th transition-colors
                                ${isActive ? 'text-accent-cyan' : 'text-gray-200 hover:text-accent-cyan'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{niceName(col)}</span>
                      <SortIcon
                        size={11}
                        className={`shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover/th:opacity-60'}`}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className={`transition-colors hover:bg-bg-hover/60
                            ${i % 2 === 0 ? 'bg-transparent' : 'bg-bg-secondary/30'}`}
              >
                {columns.map(col => (
                  <td
                    key={col}
                    className="px-3 py-1.5 text-gray-400 border-b border-border/40 whitespace-nowrap"
                  >
                    {String(row[col] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 text-[10px] text-gray-500 bg-bg-secondary border-t border-border flex items-center justify-between">
        <span>
          {sortedRows.length} / {data.length} {t('home.um')}
        </span>
        {data.length > 200 && (
          <span className="text-accent-cyan/70">yalnız ilk 200 sətir göstərilir</span>
        )}
      </div>
    </div>
  );
};

export default TableRenderer;