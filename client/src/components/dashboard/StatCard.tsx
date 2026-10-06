import { Loader2, TrendingUp } from 'lucide-react';
import { StatCardConfig } from '../../config/dashboards';
import { FetchedDataset } from '../../types/dataset';

interface Props {
  config: StatCardConfig;
  dataset: FetchedDataset | null;
  loading: boolean;
}

const colorMap = {
  cyan: { bg: 'from-accent-cyan/20 to-accent-cyan/5', text: 'text-accent-cyan', border: 'border-accent-cyan/30' },
  purple: { bg: 'from-accent-purple/20 to-accent-purple/5', text: 'text-accent-purple', border: 'border-accent-purple/30' },
  pink: { bg: 'from-accent-pink/20 to-accent-pink/5', text: 'text-accent-pink', border: 'border-accent-pink/30' },
  blue: { bg: 'from-accent-blue/20 to-accent-blue/5', text: 'text-accent-blue', border: 'border-accent-blue/30' }
};

const StatCard = ({ config, dataset, loading }: Props) => {
  const c = colorMap[config.color];

  let value = '—';
  let unit = '';

  if (dataset && Array.isArray(dataset.data) && dataset.data.length > 0) {
    const rows = dataset.data;

    if (config.aggregation === 'count') {
      value = rows.length.toLocaleString('az');
      unit = 'qeyd';
    } else {
      const key = config.valueKey ||
        Object.keys(rows[0]).find(k => {
          const v = rows[0][k];
          return v !== null && v !== '' && !isNaN(Number(String(v).replace(/[^\d.-]/g, '')));
        });

      if (key) {
        const total = rows.reduce((sum, row) => {
          const v = Number(String(row[key] ?? '').replace(/[^\d.-]/g, ''));
          return sum + (isNaN(v) ? 0 : v);
        }, 0);
        value = total.toLocaleString('az');
        unit = `${rows.length} qeyd`;
      }
    }
  }

  return (
    <div className={`rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} p-4`}>
      <div className={`w-8 h-8 rounded-lg bg-bg-primary/50 flex items-center justify-center ${c.text} mb-2`}>
        <TrendingUp size={16} />
      </div>
      <div className="text-[11px] text-gray-400 uppercase tracking-wide truncate">
        {config.title}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        {loading ? (
          <Loader2 size={20} className={`${c.text} animate-spin`} />
        ) : (
          <span className={`text-xl font-bold ${c.text}`}>{value}</span>
        )}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5 truncate">
        {config.subtitle} {unit && `• ${unit}`}
      </div>
    </div>
  );
};

export default StatCard;