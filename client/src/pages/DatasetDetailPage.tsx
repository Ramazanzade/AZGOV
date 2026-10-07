import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Download, ExternalLink, Loader2, AlertCircle,
  Database, TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3,
  MapPin, FileText, Info, Hash, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDatasets } from '../hooks/useDatasets';
import { fetchDatasetByUrl } from '../services/api';
import { FetchedDataset, DatasetSummary } from '../types/dataset';
import TableRenderer from '../components/renderers/TableRenderer';
import MapRenderer from '../components/renderers/MapRenderer';
import MultiSeriesLineChart from '../components/renderers/MultiSeriesLineChart';
import ExportButtons from '../components/ui/ExportButtons';
import { niceName } from '../utils/columnLabels';
import { buildMultiSeries } from '../utils/chartHelpers';
import { detectGeoPoints } from '../utils/geoHelpers';
import MarkerMap from '../components/renderers/MarkerMap';
import { useLang } from '../i18n/LanguageContext';

const COLORS = ['#22d3ee', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

type AggType = 'sum' | 'avg' | 'max' | 'min' | 'count';

// ---------- Encoding bərpası ----------
// Yalnız hərflər arasındakı "?" → "ə" (cümlə sonundakı sual işarələrinə toxunmur)
const fixText = (s: string) => s.replace(/(?<=\p{L})\?(?=\p{L})/gu, 'ə');
const ID_LIKE_KEYS = /^(s\/n|s_n|sn|no|#|id|index|sıra|sira|nömrə|nomre)$/i;

// ---------- Sütun tanıma ----------
const detectColumns = (data: any[]) => {
  if (!Array.isArray(data) || data.length === 0) return null;

  const sample = data.slice(0, 20);
  const keys = Object.keys(data[0]);

  const numeric: string[] = [];
  const categorical: string[] = [];
  const dates: string[] = [];

  keys.forEach(k => {
    // ID/indeks sütunlarını tamamilə atla
    if (ID_LIKE_KEYS.test(k.trim())) return;

    let numericHits = 0;
    let dateHits = 0;
    let textHits = 0;

    sample.forEach(row => {
      const raw = String(row[k] ?? '').trim();
      if (raw === '') return;

      if (/^\d{4}(-\d{1,2}(-\d{1,2})?)?$/.test(raw)) {
        dateHits++;
        return;
      }

      const cleaned = raw.replace(/\s/g, '').replace(/,/g, '.');
      if (/^[-+]?\d*\.?\d+$/.test(cleaned)) {
        numericHits++;
      } else {
        textHits++;
      }
    });

    const total = numericHits + dateHits + textHits;
    if (total === 0) return;

    if (dateHits / total > 0.6) dates.push(k);
    else if (numericHits / total > 0.7) numeric.push(k);
    else categorical.push(k);
  });

  return { keys, numeric, categorical, dates };
};

const computeStats = (data: any[], numericKey?: string) => {
  if (!numericKey) return null;
  const nums = data
    .map(r => Number(String(r[numericKey] ?? '').replace(/[^\d.-]/g, '')))
    .filter(n => !isNaN(n));
  if (nums.length === 0) return null;

  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = sum / nums.length;
  const max = Math.max(...nums);
  const min = Math.min(...nums);

  return { sum, avg, max, min, count: nums.length };
};

const fmtNum = (n: number) => {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + ' mlrd';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + ' mln';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(2);
};

// ---------- Səhifə ----------
const DatasetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { datasets } = useDatasets();
  const [data, setData] = useState<FetchedDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoFix, setAutoFix] = useState(false);
  const [aggregation, setAggregation] = useState<AggType>('sum');
const { t } = useLang();

  const chartRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const stateDataset = (location.state as any)?.dataset as DatasetSummary | undefined;
  const dataset = stateDataset || datasets.find(d => d.id === id);

  useEffect(() => {
    if (!dataset) return;
    setLoading(true); setError(null);
    fetchDatasetByUrl(dataset.metadataUrl)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dataset]);

  // autoFix aktivdirsə data-dakı "?" işarələri bərpa olunur
  const fixedData = useMemo(() => {
    if (!autoFix || !data) return data;
    return {
      ...data,
      data: Array.isArray(data.data)
        ? data.data.map((row: any) =>
            Object.fromEntries(
              Object.entries(row).map(([k, v]) => [
                k,
                typeof v === 'string' ? fixText(v) : v
              ])
            )
          )
        : data.data
    };
  }, [data, autoFix]);

  const analysis = useMemo(() => {
    if (!fixedData || !Array.isArray(fixedData.data) || fixedData.data.length === 0) return null;
    const rows = fixedData.data;
    const cols = detectColumns(rows);
    if (!cols) return null;

    const numericKey = cols.numeric[0];
    const categoryKey =
      cols.categorical.find(k => !/unit|measure|vahid|title/i.test(k)) ||
      cols.categorical[0];
    const timeKey = cols.dates[0];
    const stats = computeStats(rows, numericKey);

    // Line chart (fallback — tək xətt)
    let lineData: any[] = [];
    if (timeKey && numericKey) {
      const m = new Map<string, number>();
      rows.forEach((r: any) => {
        const t = String(r[timeKey]);
        const v = Number(String(r[numericKey]).replace(/[^\d.-]/g, '')) || 0;
        m.set(t, (m.get(t) || 0) + v);
      });
      lineData = Array.from(m.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 50);
    }

    // Bar chart
    let barData: any[] = [];
    if (categoryKey && numericKey && categoryKey !== timeKey) {
      const m = new Map<string, number>();
      rows.forEach((r: any) => {
        const k = String(r[categoryKey] ?? '—').slice(0, 25);
        const v = Number(String(r[numericKey]).replace(/[^\d.-]/g, '')) || 0;
        m.set(k, (m.get(k) || 0) + v);
      });
      barData = Array.from(m.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }

    // Multi-series hazırla
    const multiSeries =
      timeKey && categoryKey && numericKey && categoryKey !== timeKey
        ? buildMultiSeries(rows, timeKey, categoryKey, numericKey)
        : null;

    // Lat/lon aşkarlama
    const geoPoints = detectGeoPoints(rows);

    return {
      cols, numericKey, categoryKey, timeKey, stats,
      lineData, barData, pieData: barData.slice(0, 6),
      totalRows: rows.length,
      multiSeries,
      geoPoints    // ← YENİ
    };
  }, [fixedData]);

  if (!dataset) {
    return (
      <div className="p-6 text-gray-400">
        {t('detail.notFound')} <Link to="/" className="text-accent-cyan">{t('detail.back')}</Link>
        <h3>{t('detail.rawData')}</h3>

      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-cyan mb-3">
              <ArrowLeft size={12} /> {t('detail.back')}
            </Link>
            <h1 className="text-xl font-bold text-gray-100 mb-2">{dataset.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              <span>{dataset.organization}</span>
              <span className="px-2 py-0.5 rounded bg-bg-card border border-border">{dataset.format}</span>
              {data && <span>• {data.meta.totalRecords} {t('detail.rows')}</span>}
            </div>
          </div>
          {/* Export buttons */}
          <ExportButtons
            title={dataset.title}
            data={Array.isArray(fixedData?.data) ? fixedData.data : undefined}
            chartRef={chartRef}
          />
        </div>

        {/* Encoding xəbərdarlığı */}
        {data?.meta?.corrupted && (
          <div className="mb-4 flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">{t('detail.encodingWarning1')}</div>
              <div className="text-xs mt-1 text-yellow-300/80">
                 {t('detail.encodingWarning2')} {data.meta.corruptionCount} 
              </div>
              <button
                onClick={() => setAutoFix(v => !v)}
                className="mt-3 px-3 py-1.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-xs font-medium hover:bg-yellow-500/30"
              >
                {autoFix ? '✓ Bərpa aktivdir' : 'Bərpa etməyə çalış'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="text-accent-cyan animate-spin" />
            <span className="text-sm text-gray-400">{t('detail.loading')}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle size={18} />
            <div>
              <div className="font-medium">{t('detail.error')}</div>
              <div className="text-xs mt-1">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && analysis && (
          <>
            {/* Stat cards & Aggregation controls */}
          {analysis.stats && (
  <div className="rounded-xl bg-bg-card border border-border p-4 mb-5">
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-accent-cyan" />
        <span className="text-sm font-semibold">
          {niceName(analysis.numericKey)} — {t('detail.stats')}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-bg-primary border border-border rounded-lg p-1">
        {(['sum', 'avg', 'max', 'min', 'count'] as AggType[]).map(agg => (
          <button
            key={agg}
            onClick={() => setAggregation(agg)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition ${
              aggregation === agg
                ? 'bg-accent-cyan/15 text-accent-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {agg === 'sum'   ? t('detail.sum')   :
             agg === 'avg'   ? t('detail.avg')   :
             agg === 'max'   ? t('detail.max')   :
             agg === 'min'   ? t('detail.min')   :
                               t('detail.count')}
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Hash}
        label={t('detail.sum')}
        hint={`${t('detail.hintSum')} — "${niceName(analysis.numericKey)}"`}
        value={fmtNum(analysis.stats.sum)}
        color="purple"
        highlight={aggregation === 'sum'}
      />
      <StatCard
        icon={Activity}
        label={t('detail.avg')}
        hint={`${t('detail.hintAvg')} — "${niceName(analysis.numericKey)}"`}
        value={fmtNum(analysis.stats.avg)}
        color="cyan"
        highlight={aggregation === 'avg'}
      />
      <StatCard
        icon={TrendingUp}
        label={t('detail.max')}
        hint={`${t('detail.hintMax')} — "${niceName(analysis.numericKey)}"`}
        value={fmtNum(analysis.stats.max)}
        color="pink"
        highlight={aggregation === 'max'}
      />
      <StatCard
        icon={TrendingDown}
        label={t('detail.min')}
        hint={`${t('detail.hintMin')} — "${niceName(analysis.numericKey)}"`}
        value={fmtNum(analysis.stats.min)}
        color="blue"
        highlight={aggregation === 'min'}
      />
    </div>
  </div>
)}

            {/* Multi-series line chart (prioritet) */}
            {analysis.multiSeries && analysis.multiSeries.series.length > 1 && (
              <div ref={chartRef} className="rounded-xl bg-bg-card border border-border p-4 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent-cyan" />
                    <h3 className="text-sm font-semibold">
                      {niceName(analysis.timeKey)} {t('detail.periodDynamics1')}
                      {analysis.categoryKey && ` — ${niceName(analysis.categoryKey)} üzrə`}
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {analysis.multiSeries.series.length} seriya
                  </span>
                </div>
                <MultiSeriesLineChart result={analysis.multiSeries} />
              </div>
            )}

            {/* Fallback — tək xətt (multi-series mümkün deyilsə) */}
            {!analysis.multiSeries && analysis.lineData.length > 1 && (
              <div ref={chartRef} className="rounded-xl bg-bg-card border border-border p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-accent-cyan" />
                  <h3 className="text-sm font-semibold">
                    {t('detail.periodDynamics')} — {niceName(analysis.numericKey)}
                  </h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer>
                    <LineChart data={analysis.lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                      <YAxis stroke="#6b7280" fontSize={10} tickFormatter={fmtNum} />
                      <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pie + Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              {analysis.pieData.length > 1 && (
                <div className="rounded-xl bg-bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieIcon size={14} className="text-accent-purple" />
                    <h3 className="text-sm font-semibold">{t('detail.distribution')} — {niceName(analysis.categoryKey)}</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={analysis.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={{ fontSize: 10, fill: '#9ca3af' }}>
                          {analysis.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {analysis.barData.length > 1 && (
                <div className={`rounded-xl bg-bg-card border border-border p-4 ${analysis.pieData.length > 1 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={14} className="text-accent-pink" />
                    <h3 className="text-sm font-semibold">{t('detail.top10')} — {niceName(analysis.categoryKey)}</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <BarChart data={analysis.barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
                        <XAxis type="number" stroke="#6b7280" fontSize={10} tickFormatter={fmtNum} />
                        <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={10} width={130} />
                        <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Lat/Lon marker xəritəsi */}
            {analysis.geoPoints && analysis.geoPoints.points.length > 0 && (
              <div className="rounded-xl bg-bg-card border border-border p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-accent-cyan" />
                    <h3 className="text-sm font-semibold">
                      {t('detail.map')} — {analysis.geoPoints.points.length}
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {t('detail.columns')}: {analysis.geoPoints.latKey} / {analysis.geoPoints.lonKey}
                  </span>
                </div>
                <MarkerMap detection={analysis.geoPoints} />
              </div>
            )}

            {/* GeoJSON map */}
            {fixedData?.meta.isGeoJSON && (
              <div className="rounded-xl bg-bg-card border border-border p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-accent-cyan" />
                  <h3 className="text-sm font-semibold">{t('detail.map')}</h3>
                </div>
                <MapRenderer data={fixedData.data} />
              </div>
            )}

            {/* Table */}
            <div className="rounded-xl bg-bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <FileText size={14} className="text-gray-500" />
                <h3 className="text-sm font-semibold">{t('detail.rawData')}</h3>
              </div>
              <div className="p-4">
                <TableRenderer data={fixedData?.data ?? []} />
              </div>
            </div>
          </>
        )}

        {!loading && !error && fixedData && !analysis && (
          <div className="rounded-xl bg-bg-card border border-border p-6">
            <TableRenderer data={Array.isArray(fixedData.data) ? fixedData.data : [fixedData.data]} />
          </div>
        )}
      </div>

      {/* Sağ info panel */}
      <aside className="w-72 bg-bg-secondary border-l border-border p-4 overflow-y-auto hidden lg:block">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Info size={14} className="text-gray-400" />  {t('info.title')}
        </h3>
       <InfoRow label={t('info.name')} value={dataset.title} />
<InfoRow label={t('info.organization')} value={dataset.organization} />
<InfoRow label={t('info.format')} value={dataset.format} />
{data && <InfoRow label={t('info.recordCount')} value={String(data.meta.totalRecords)} />}
{analysis?.timeKey && <InfoRow label={t('info.timeColumn')} value={analysis.timeKey} />}
{analysis?.numericKey && <InfoRow label={t('info.numericColumn')} value={analysis.numericKey} />}
{analysis?.categoryKey && <InfoRow label={t('info.categoryColumn')} value={analysis.categoryKey} />}
        <div className="mt-6 space-y-2">
          {dataset.resourceUrl && (
            <a href={dataset.resourceUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20">
              <Download size={12} />  {t('info.download')}
            </a>
          )}
          <a href={dataset.metadataUrl} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-bg-card border border-border text-gray-400 hover:text-accent-cyan text-xs font-medium">
            <ExternalLink size={12} /> {t('info.apiMetadata')}
          </a>
        </div>
      </aside>
    </div>
  );
};

// ---------- Alt komponentlər ----------
interface StatCardProps {
  icon: any;
  label: string;
  hint?: string;
  value: string;
  color: 'cyan' | 'purple' | 'pink' | 'blue';
  highlight?: boolean;
}

const colorMap = {
  cyan:   'from-accent-cyan/20 to-accent-cyan/5 text-accent-cyan border-accent-cyan/30',
  purple: 'from-accent-purple/20 to-accent-purple/5 text-accent-purple border-accent-purple/30',
  pink:   'from-accent-pink/20 to-accent-pink/5 text-accent-pink border-accent-pink/30',
  blue:   'from-accent-blue/20 to-accent-blue/5 text-accent-blue border-accent-blue/30'
};

const StatCard = ({ icon: Icon, label, hint, value, color, highlight }: StatCardProps) => {
  const c = colorMap[color].split(' ');
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} border ${c[2]} p-4 group relative cursor-help transition-all ${
        highlight ? 'ring-2 ring-accent-cyan/40 scale-[1.02]' : ''
      }`}
      title={hint}
    >
      <div className={`w-8 h-8 rounded-lg bg-bg-primary/50 flex items-center justify-center ${c[3]} mb-2`}>
        <Icon size={14} />
      </div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide truncate" title={label}>
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${c[3]} truncate`}>
        {value}
      </div>
      {hint && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-[10px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          {hint}
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="mb-3">
    <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">{label}</div>
    <div className="text-xs text-gray-200 break-words">{value}</div>
  </div>
);

export default DatasetDetailPage;