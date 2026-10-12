import { Loader2, TrendingUp, TrendingDown, Minus,Maximize2  } from 'lucide-react';
import { StatCardConfig } from '../../config/dashboards';
import { FetchedDataset } from '../../types/dataset';

interface Props {
  config: StatCardConfig;
  dataset: FetchedDataset | null;
  loading: boolean;
  onExpand?: () => void; 
}

// Variant A — tək primary accent. Hər kart üçün yalnız ton fərqi.
const toneMap = {
  cyan:   { bar: 'bg-accent-cyan',   text: 'text-accent-cyan',   soft: 'bg-accent-cyan/10'   },
  purple: { bar: 'bg-accent-purple', text: 'text-accent-purple', soft: 'bg-accent-purple/10' },
  pink:   { bar: 'bg-accent-pink',   text: 'text-accent-pink',   soft: 'bg-accent-pink/10'   },
  blue:   { bar: 'bg-accent-blue',   text: 'text-accent-blue',   soft: 'bg-accent-blue/10'   },
};

const StatCard = ({ config, dataset, loading, onExpand }: Props) => {
  const t = toneMap[config.color];

  let value = '—';
  let unit = '';
  let trend: { dir: 'up' | 'down' | 'flat'; pct: number } | null = null;
  let spark: number[] = [];

  if (dataset && Array.isArray(dataset.data) && dataset.data.length > 0) {
    const rows = dataset.data;

    if (config.aggregation === 'count') {
      value = rows.length.toLocaleString('az');
      unit = 'qeyd';
    } else {
      const key =
        config.valueKey ||
        Object.keys(rows[0]).find(k => {
          const v = rows[0][k];
          return v !== null && v !== '' && !isNaN(Number(String(v).replace(/[^\d.-]/g, '')));
        });

      if (key) {
        const nums = rows
          .map(row => Number(String(row[key] ?? '').replace(/[^\d.-]/g, '')))
          .filter(n => !isNaN(n));
        const total = nums.reduce((s, n) => s + n, 0);
        value = total.toLocaleString('az');
        unit = `${rows.length} qeyd`;
        spark = nums.slice(-12);

        if (nums.length >= 4) {
          const half = Math.floor(nums.length / 2);
          const first = nums.slice(0, half).reduce((s, n) => s + n, 0) / half;
          const second = nums.slice(half).reduce((s, n) => s + n, 0) / (nums.length - half);
          const pct = first === 0 ? 0 : ((second - first) / first) * 100;
          trend = {
            dir: pct > 1 ? 'up' : pct < -1 ? 'down' : 'flat',
            pct: Math.abs(pct),
          };
        }
      }
    }
  }

  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend?.dir === 'up'
      ? 'text-accent-green'
      : trend?.dir === 'down'
      ? 'text-accent-pink'
      : 'text-gray-500';

  return (
    <div onClick={onExpand}
  className="relative group rounded-xl bg-bg-card border border-border
             hover:border-border/80 hover:-translate-y-0.5
             transition-all duration-300 overflow-hidden animate-slide-up
             cursor-pointer">
      {/* Sol kənarda accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`} />
{/* YENİ: sağ üstdə expand ikonu */}
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                  w-6 h-6 rounded-md bg-bg-primary/80 border border-border
                  flex items-center justify-center text-gray-400">
    <Maximize2 size={11} />
  </div>
      <div className="pl-5 pr-4 py-4">
        {/* Başlıq + trend */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-md ${t.soft} flex items-center justify-center ${t.text} shrink-0`}>
              <TrendingUp size={14} />
            </div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider truncate font-medium">
              {config.title}
            </span>
          </div>

          {trend && !loading && (
            <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor} shrink-0`}>
              <TrendIcon size={11} />
              {trend.pct.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Dəyər */}
        {loading ? (
          <Loader2 size={20} className={`${t.text} animate-spin`} />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-50 tracking-tight">{value}</span>
            {unit && <span className="text-[10px] text-gray-500 font-medium">{unit}</span>}
          </div>
        )}

        <div className="text-[10px] text-gray-500 mt-1 truncate">{config.subtitle}</div>
      </div>

      {/* Sparkline */}
      {spark.length > 1 && !loading && (
        <svg
          viewBox={`0 0 ${spark.length - 1} 20`}
          className="absolute bottom-0 left-0 right-0 h-5 w-full opacity-30 group-hover:opacity-60 transition-opacity"
          preserveAspectRatio="none"
        >
          <polyline
            points={spark
              .map((v, i) => {
                const max = Math.max(...spark);
                const min = Math.min(...spark);
                const range = max - min || 1;
                return `${i},${20 - ((v - min) / range) * 18 - 1}`;
              })
              .join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
            className={t.text}
          />
        </svg>
      )}
    </div>
  );
};

export default StatCard;