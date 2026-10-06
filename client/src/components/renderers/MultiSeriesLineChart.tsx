import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { MultiSeriesResult } from '../../utils/chartHelpers';
import { niceName } from '../../utils/columnLabels';

interface Props {
  result: MultiSeriesResult;
}

const MultiSeriesLineChart = ({ result }: Props) => {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggleSeries = (key: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleSeries = result.series.filter(s => !hidden.has(s.key));

  return (
    <div>
      <div className="h-[420px]">
        <ResponsiveContainer>
          <LineChart data={result.data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
            <XAxis
              dataKey="period"
              stroke="#6b7280"
              fontSize={11}
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tick={{ fill: '#9ca3af' }}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' :
                Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                background: '#1a1f35',
                border: '1px solid #2a3050',
                borderRadius: 8,
                fontSize: 12
              }}
              formatter={(v: any) => v === null ? '—' : Number(v).toLocaleString('az')}
            />
            {visibleSeries.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend — toggle üçün */}
      <div className="flex flex-wrap gap-2 mt-3">
        {result.series.map(s => {
          const isHidden = hidden.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] transition ${
                isHidden
                  ? 'bg-bg-primary/50 border-border/50 text-gray-600'
                  : 'bg-bg-primary border-border text-gray-300 hover:border-accent-cyan/50'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isHidden ? '#4b5563' : s.color
                }}
              />
              <span className="truncate max-w-[180px]" title={s.key}>
                {niceName(s.key) || s.key}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSeriesLineChart;