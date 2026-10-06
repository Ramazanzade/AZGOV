import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Props { data: any[] }

type ChartType = 'line' | 'bar' | 'pie';

const COLORS = ['#22d3ee', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

const ChartRenderer = ({ data }: Props) => {
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Analiz: numeric və categorical sütunları tapırıq
  const analysis = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const sample = data[0];
    const keys = Object.keys(sample);

    const numericKeys: string[] = [];
    const labelKeys: string[] = [];

    keys.forEach(k => {
      const val = sample[k];
      const parsed = Number(String(val).replace(/[^\d.-]/g, ''));
      if (!isNaN(parsed) && String(val).trim() !== '' && isFinite(parsed)) {
        numericKeys.push(k);
      } else {
        labelKeys.push(k);
      }
    });

    // Pie üçün: 1 label + 1 numeric
    // Line/Bar üçün: 1 label + 1+ numeric
    return { keys, numericKeys, labelKeys };
  }, [data]);

  if (!analysis) {
    return <div className="text-gray-500 text-sm p-4">Data yoxdur</div>;
  }

  const { numericKeys, labelKeys } = analysis;
  const labelKey = labelKeys[0] || 'name';
  const valueKey = numericKeys[0];

  if (!valueKey) {
    return <div className="text-gray-500 text-sm p-4">Rəqəmsal sütun tapılmadı</div>;
  }

  // Yalnız 10 sətir göstər (qrafik üçün)
  const chartData = data.slice(0, 20).map(row => ({
    ...row,
    [labelKey]: String(row[labelKey] || '—').slice(0, 20),
    [valueKey]: Number(String(row[valueKey]).replace(/[^\d.-]/g, '')) || 0
  }));

  return (
    <div>
      {/* Chart tipi seçimi */}
      <div className="flex items-center gap-1 mb-4 bg-bg-primary border border-border rounded-lg p-1 w-fit">
        {(['line', 'bar', 'pie'] as ChartType[]).map(t => (
          <button
            key={t}
            onClick={() => setChartType(t)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              chartType === t
                ? 'bg-accent-cyan/15 text-accent-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'line' ? '📈 Line' : t === 'bar' ? '📊 Bar' : '🥧 Pie'}
          </button>
        ))}
      </div>

      <div className="h-[60vh] w-full">
        <ResponsiveContainer>
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
              <XAxis dataKey={labelKey} stroke="#6b7280" fontSize={10} angle={-30} textAnchor="end" />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey={valueKey} stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
              <XAxis dataKey={labelKey} stroke="#6b7280" fontSize={10} angle={-30} textAnchor="end" />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey={valueKey} fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                dataKey={valueKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={140}
                label={{ fontSize: 10, fill: '#9ca3af' }}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;