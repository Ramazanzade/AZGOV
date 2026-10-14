import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, ExternalLink, Loader2, AlertCircle,
  Maximize2, TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3,
  MapPin, FileText, Info, Hash, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDatasets } from '../hooks/useDatasets';
import { FetchedDataset, DatasetSummary } from '../types/dataset';
import TableRenderer from '../components/renderers/TableRenderer';
import MapRenderer from '../components/renderers/MapRenderer';
import MultiSeriesLineChart from '../components/renderers/MultiSeriesLineChart';
import ExportButtons from '../components/ui/ExportButtons';
import ExpandableModal from '../components/ui/ExpandableModal';
import { niceName } from '../utils/columnLabels';
import { buildMultiSeries } from '../utils/chartHelpers';
import { detectGeoPoints } from '../utils/geoHelpers';
import MarkerMap from '../components/renderers/MarkerMap';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { fetchDatasetContentCached } from '../services/api';

const COLORS = ['#22d3ee', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

type AggType = 'sum' | 'avg' | 'max' | 'min' | 'count';
type ChartType = 'line' | 'bar' | 'pie' | 'table';
type Expanded =
  | { kind: 'stat'; agg: AggType }
  | { kind: 'chart'; type: ChartType }
  | null;

const fixText = (s: string) => s.replace(/(?<=\p{L})\?(?=\p{L})/gu, 'ə');
const ID_LIKE_KEYS = /^(s\/n|s_n|sn|no|#|id|index|sıra|sira|nömrə|nomre)$/i;

const detectColumns = (data: any[]) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const sample = data.slice(0, 20);
  const keys = Object.keys(data[0]);
  const numeric: string[] = [];
  const categorical: string[] = [];
  const dates: string[] = [];

  keys.forEach(k => {
    if (ID_LIKE_KEYS.test(k.trim())) return;
    let numericHits = 0, dateHits = 0, textHits = 0;
    sample.forEach(row => {
      const raw = String(row[k] ?? '').trim();
      if (raw === '') return;
      if (/^\d{4}(-\d{1,2}(-\d{1,2})?)?$/.test(raw)) { dateHits++; return; }
      const cleaned = raw.replace(/\s/g, '').replace(/,/g, '.');
      if (/^[-+]?\d*\.?\d+$/.test(cleaned)) numericHits++; else textHits++;
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

const DatasetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { datasets } = useDatasets();
  const [data, setData] = useState<FetchedDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoFix, setAutoFix] = useState(false);
  const [aggregation, setAggregation] = useState<AggType>('sum');
  const [expanded, setExpanded] = useState<Expanded>(null);
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const chartRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const stateDataset = (location.state as any)?.dataset as DatasetSummary | undefined;
  const dataset = stateDataset || datasets.find(d => String(d.id) === String(id));
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetchDatasetContentCached(Number(id))
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fixedData = useMemo(() => {
    if (!autoFix || !data) return data;
    return {
      ...data,
      data: Array.isArray(data.data)
        ? data.data.map((row: any) =>
            Object.fromEntries(
              Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? fixText(v) : v])
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
      cols.categorical.find(k => !/unit|measure|vahid|title/i.test(k)) || cols.categorical[0];
    const timeKey = cols.dates[0];
    const stats = computeStats(rows, numericKey);

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

    const multiSeries =
      timeKey && categoryKey && numericKey && categoryKey !== timeKey
        ? buildMultiSeries(rows, timeKey, categoryKey, numericKey)
        : null;

    const geoPoints = detectGeoPoints(rows);

    return {
      cols, numericKey, categoryKey, timeKey, stats,
      lineData, barData, pieData: barData.slice(0, 6),
      totalRows: rows.length,
      multiSeries,
      geoPoints
    };
  }, [fixedData]);

  const modalTitle = (() => {
    if (!expanded) return '';
    if (expanded.kind === 'stat') {
      const map: Record<AggType, string> = {
        sum: t('detail.sum'), avg: t('detail.avg'),
        max: t('detail.max'), min: t('detail.min'),
        count: t('detail.count'),
      };
      return `${map[expanded.agg]} — ${niceName(analysis?.numericKey || '')}`;
    }
    if (expanded.kind === 'chart') {
      const map: Record<ChartType, string> = {
        line: 'Dinamika', bar: 'Top 10', pie: 'Bölgü', table: 'Xam data',
      };
      return map[expanded.type];
    }
    return '';
  })();

  if (!dataset) {
    return (
      <div className="p-6 text-gray-400">
        {t('detail.notFound')} <Link to="/" className="text-accent-cyan">{t('detail.back')}</Link>
        <h3>{t('detail.rawData')}</h3>
      </div>
    );
  }

  // ✅ Format yoxlamaları — təkrar istifadə üçün
  const fmt = fixedData?.meta?.format;
  const isPdf = fmt === 'PDF';
  const isExternal = fmt === 'EXTERNAL';
  const canAnalyze = !isPdf && !isExternal;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <button
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate('/');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-cyan mb-3"
            >
              <ArrowLeft size={12} /> {t('detail.back')}
            </button>
            <h1 className="text-xl font-bold text-gray-100 mb-2">{dataset.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              <span>{dataset.organization || '—'}</span>
              <span className="px-2 py-0.5 rounded bg-bg-card border border-border">{dataset.format}</span>
              {data && <span>• {data.meta.totalRecords} {t('detail.rows')}</span>}
            </div>
          </div>
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
                {t('detail.encodingWarning2')} {data.meta.corruptionCount ?? 0}
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

        {/* ✅ PDF render */}
        {!loading && !error && isPdf && data?.meta?.url && (
          <div className="rounded-xl bg-bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-2">
                <FileText size={14} className="text-accent-cyan" />
                PDF önizləmə
              </span>
              <a
                href={data.meta.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-cyan hover:underline flex items-center gap-1"
              >
                <ExternalLink size={12} />
                Yeni tabda aç
              </a>
            </div>
            <iframe
              src={data.meta.url}
              title={dataset.title}
              className="w-full min-h-[75vh] rounded-lg border border-border bg-white"
            />
          </div>
        )}

        {/* ✅ EXTERNAL render */}
        {!loading && !error && isExternal && data?.meta?.url && (
          <div className="rounded-xl bg-bg-card border border-border p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
              <ExternalLink size={32} className="text-accent-cyan" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {data.meta.fileName || dataset.title}
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Bu fayl xarici mənbədə (rəsmi dövlət portalı) yerləşir.
              Yükləmək üçün aşağıdaki düyməyə klikləyin.
            </p>
            <a
              href={data.meta.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                         bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan
                         hover:bg-accent-cyan/20 transition-all font-medium"
            >
              <Download size={16} />
              Xarici mənbədən yüklə
            </a>
            <div className="mt-4 text-[11px] text-gray-500 break-all max-w-lg mx-auto">
              {data.meta.url}
            </div>
          </div>
        )}

        {/* ✅ Analiz bloku — yalnız PDF/EXTERNAL olmayanlar üçün */}
        {!loading && !error && canAnalyze && analysis && (
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
                        {agg === 'sum' ? t('detail.sum') :
                         agg === 'avg' ? t('detail.avg') :
                         agg === 'max' ? t('detail.max') :
                         agg === 'min' ? t('detail.min') :
                                          t('detail.count')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard icon={Hash} label={t('detail.sum')}
                    hint={`${t('detail.hintSum')} — "${niceName(analysis.numericKey)}"`}
                    value={fmtNum(analysis.stats.sum)} color="purple"
                    highlight={aggregation === 'sum'}
                    onClick={() => { setAggregation('sum'); setExpanded({ kind: 'stat', agg: 'sum' }); }} />
                  <StatCard icon={Activity} label={t('detail.avg')}
                    hint={`${t('detail.hintAvg')} — "${niceName(analysis.numericKey)}"`}
                    value={fmtNum(analysis.stats.avg)} color="cyan"
                    highlight={aggregation === 'avg'}
                    onClick={() => { setAggregation('avg'); setExpanded({ kind: 'stat', agg: 'avg' }); }} />
                  <StatCard icon={TrendingUp} label={t('detail.max')}
                    hint={`${t('detail.hintMax')} — "${niceName(analysis.numericKey)}"`}
                    value={fmtNum(analysis.stats.max)} color="pink"
                    highlight={aggregation === 'max'}
                    onClick={() => { setAggregation('max'); setExpanded({ kind: 'stat', agg: 'max' }); }} />
                  <StatCard icon={TrendingDown} label={t('detail.min')}
                    hint={`${t('detail.hintMin')} — "${niceName(analysis.numericKey)}"`}
                    value={fmtNum(analysis.stats.min)} color="blue"
                    highlight={aggregation === 'min'}
                    onClick={() => { setAggregation('min'); setExpanded({ kind: 'stat', agg: 'min' }); }} />
                </div>
              </div>
            )}

            {/* Multi-series line chart */}
            {analysis.multiSeries && analysis.multiSeries.series.length > 1 && (
              <div ref={chartRef} data-export-chart data-export-title="dinamika"
                onClick={() => setExpanded({ kind: 'chart', type: 'line' })}
                className="rounded-xl bg-bg-card border border-border p-4 mb-5 cursor-pointer hover:border-accent-cyan/40 transition-colors group/chart relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover/chart:opacity-100 transition-opacity w-7 h-7 rounded-md bg-bg-primary/80 border border-border flex items-center justify-center text-gray-400">
                  <Maximize2 size={12} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent-cyan" />
                    <h3 className="text-sm font-semibold">
                      {niceName(analysis.timeKey)} {t('detail.periodDynamics1')}
                      {analysis.categoryKey && ` — ${niceName(analysis.categoryKey)} üzrə`}
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 mr-8">
                    {analysis.multiSeries.series.length} seriya
                  </span>
                </div>
                <MultiSeriesLineChart result={analysis.multiSeries} />
              </div>
            )}

            {/* Fallback — tək xətt */}
            {!analysis.multiSeries && analysis.lineData.length > 1 && (
              <div ref={chartRef} data-export-chart data-export-title="dinamika"
                onClick={() => setExpanded({ kind: 'chart', type: 'line' })}
                className="rounded-xl bg-bg-card border border-border p-4 mb-5 cursor-pointer hover:border-accent-cyan/40 transition-colors group/chart relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover/chart:opacity-100 transition-opacity w-7 h-7 rounded-md bg-bg-primary/80 border border-border flex items-center justify-center text-gray-400">
                  <Maximize2 size={12} />
                </div>
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
                <div data-export-chart data-export-title="bolgu"
                  onClick={() => setExpanded({ kind: 'chart', type: 'pie' })}
                  className="rounded-xl bg-bg-card border border-border p-4 cursor-pointer hover:border-accent-purple/40 transition-colors group/pie relative">
                  <div className="absolute top-3 right-3 opacity-0 group-hover/pie:opacity-100 transition-opacity w-7 h-7 rounded-md bg-bg-primary/80 border border-border flex items-center justify-center text-gray-400">
                    <Maximize2 size={12} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <PieIcon size={14} className="text-accent-purple" />
                    <h3 className="text-sm font-semibold">{t('detail.distribution')} — {niceName(analysis.categoryKey)}</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={analysis.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                             innerRadius={50} outerRadius={90} label={{ fontSize: 10, fill: '#9ca3af' }}>
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
                <div data-export-chart data-export-title="top10"
                  onClick={() => setExpanded({ kind: 'chart', type: 'bar' })}
                  className={`rounded-xl bg-bg-card border border-border p-4 cursor-pointer hover:border-accent-pink/40 transition-colors group/bar relative ${analysis.pieData.length > 1 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                  <div className="absolute top-3 right-3 opacity-0 group-hover/bar:opacity-100 transition-opacity w-7 h-7 rounded-md bg-bg-primary/80 border border-border flex items-center justify-center text-gray-400">
                    <Maximize2 size={12} />
                  </div>
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
            <div
              onClick={() => setExpanded({ kind: 'chart', type: 'table' })}
              className="rounded-xl bg-bg-card border border-border overflow-hidden cursor-pointer hover:border-accent-cyan/40 transition-colors group/table relative">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-500" />
                  <h3 className="text-sm font-semibold">{t('detail.rawData')}</h3>
                </div>
                <div className="opacity-0 group-hover/table:opacity-100 transition-opacity w-6 h-6 rounded-md bg-bg-primary/80 border border-border flex items-center justify-center text-gray-400">
                  <Maximize2 size={11} />
                </div>
              </div>
              <div className="p-4">
                <TableRenderer data={fixedData?.data ?? []} />
              </div>
            </div>
          </>
        )}

        {/* ✅ Fallback table — yalnız PDF/EXTERNAL olmayan və analiz olmayanlar üçün */}
        {!loading && !error && canAnalyze && fixedData && !analysis && (
          <div className="rounded-xl bg-bg-card border border-border p-6">
            <TableRenderer data={Array.isArray(fixedData.data) ? fixedData.data : []} />
          </div>
        )}
      </div>

      {/* Sağ info panel */}
      <aside className="w-72 bg-bg-secondary border-l border-border p-4 overflow-y-auto hidden lg:block">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Info size={14} className="text-gray-400" /> {t('info.title')}
        </h3>
        <InfoRow label={t('info.name')} value={dataset.title || '—'} />
        <InfoRow label={t('info.organization')} value={dataset.organization || '—'} />
        <InfoRow label={t('info.format')} value={dataset.format || '—'} />
        {data && <InfoRow label={t('info.recordCount')} value={String(data.meta.totalRecords ?? 0)} />}
        {analysis?.timeKey && <InfoRow label={t('info.timeColumn')} value={analysis.timeKey} />}
        {analysis?.numericKey && <InfoRow label={t('info.numericColumn')} value={analysis.numericKey} />}
        {analysis?.categoryKey && <InfoRow label={t('info.categoryColumn')} value={analysis.categoryKey} />}
        <div className="mt-6 space-y-2">
          {(dataset.resourceUrl || dataset.storageUrl || data?.meta?.url) && (
            <a
              href={isAuthenticated ? (dataset.resourceUrl || dataset.storageUrl || data?.meta?.url) || undefined : undefined}
              onClick={(e) => {
                if (!isAuthenticated) { e.preventDefault(); openAuthModal('signin'); }
              }}
              target={isAuthenticated ? '_blank' : undefined}
              rel={isAuthenticated ? 'noreferrer' : undefined}
              className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg border text-xs font-medium transition ${
                isAuthenticated
                  ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 cursor-pointer'
                  : 'bg-bg-card border-border text-gray-500 hover:border-accent-cyan/50 cursor-pointer'
              }`}
            >
              <Download size={12} />
              {t('info.download')}
            </a>
          )}
          <a href={dataset.metadataUrl || undefined} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-bg-card border border-border text-gray-400 hover:text-accent-cyan text-xs font-medium">
            <ExternalLink size={12} /> {t('info.apiMetadata')}
          </a>
        </div>
      </aside>

      {/* Modal */}
      <ExpandableModal
        open={expanded !== null}
        onClose={() => setExpanded(null)}
        title={modalTitle}
        subtitle={dataset.title}
      >
        {expanded?.kind === 'stat' && analysis?.stats && (
          <div className="h-full flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-3">
              {(['sum', 'avg', 'max', 'min'] as AggType[]).map(agg => {
                const val = agg === 'sum' ? analysis.stats!.sum
                          : agg === 'avg' ? analysis.stats!.avg
                          : agg === 'max' ? analysis.stats!.max
                                          : analysis.stats!.min;
                const labels: Record<string, string> = {
                  sum: t('detail.sum'), avg: t('detail.avg'),
                  max: t('detail.max'), min: t('detail.min'),
                };
                const colors: Record<string, string> = {
                  sum: 'text-accent-purple border-accent-purple/30 bg-accent-purple/5',
                  avg: 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5',
                  max: 'text-accent-pink border-accent-pink/30 bg-accent-pink/5',
                  min: 'text-accent-blue border-accent-blue/30 bg-accent-blue/5',
                };
                const isActive = expanded.agg === agg;
                return (
                  <button key={agg} onClick={() => setExpanded({ kind: 'stat', agg })}
                    className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${colors[agg]} ${isActive ? 'ring-2 ring-accent-cyan/40 scale-[1.02]' : 'opacity-70'}`}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{labels[agg]}</div>
                    <div className={`text-2xl font-bold ${colors[agg].split(' ')[0]}`}>{fmtNum(val)}</div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-bg-secondary border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-accent-cyan" />
                <span className="text-sm font-semibold">Statistika — {niceName(analysis.numericKey)}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div><div className="text-gray-500 mb-1">Qeyd sayı</div><div className="text-gray-200 font-medium">{analysis.stats.count}</div></div>
                <div><div className="text-gray-500 mb-1">Rekord</div><div className="text-gray-200 font-medium">{analysis.totalRows}</div></div>
                <div><div className="text-gray-500 mb-1">Sütunlar</div><div className="text-gray-200 font-medium">{analysis.cols.keys.length}</div></div>
                <div><div className="text-gray-500 mb-1">Zaman sütunu</div><div className="text-gray-200 font-medium truncate">{analysis.timeKey ? niceName(analysis.timeKey) : '—'}</div></div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-gray-500" />
                <span className="text-sm font-semibold">Xam data</span>
              </div>
              <div className="flex-1 min-h-0">
                <TableRenderer data={Array.isArray(fixedData?.data) ? fixedData.data : []} />
              </div>
            </div>
          </div>
        )}

        {expanded?.kind === 'chart' && analysis && (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-1 mb-4 p-1 bg-bg-secondary border border-border rounded-xl w-fit shrink-0">
              {([
                { type: 'line', icon: TrendingUp, label: 'Dinamika' },
                { type: 'bar', icon: BarChart3, label: 'Top 10' },
                { type: 'pie', icon: PieIcon, label: 'Bölgü' },
                { type: 'table', icon: FileText, label: 'Cədvəl' },
              ] as const).map(({ type, icon: Icon, label }) => {
                const isActive = expanded.type === type;
                return (
                  <button key={type} onClick={() => setExpanded({ kind: 'chart', type })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-accent-cyan/15 text-accent-cyan shadow-sm' : 'text-gray-400 hover:text-white hover:bg-bg-hover'}`}>
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
              <div className="ml-4 pl-4 border-l border-border flex items-center gap-3 text-[10px] text-gray-500">
                <span>📊 {analysis.totalRows} sətir</span>
                {analysis.timeKey && <span>📅 {niceName(analysis.timeKey)}</span>}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              {expanded.type === 'line' && (
                analysis.multiSeries && analysis.multiSeries.series.length > 1 ? (
                  <MultiSeriesLineChart result={analysis.multiSeries} />
                ) : analysis.lineData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysis.lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={fmtNum} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={TrendingUp} text="Zaman seriyası üçün məlumat yoxdur" />
                )
              )}

              {expanded.type === 'bar' && (
                analysis.barData.length > 1 ? (
                  <div className="h-full flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3 shrink-0">
                      <div className="rounded-xl bg-bg-secondary border border-border p-3">
                        <div className="text-[10px] uppercase text-gray-500 mb-1">🥇 Ən yüksək</div>
                        <div className="text-sm font-semibold text-accent-pink truncate">{analysis.barData[0]?.name}</div>
                        <div className="text-lg font-bold text-accent-pink">{fmtNum(analysis.barData[0]?.value || 0)}</div>
                      </div>
                      <div className="rounded-xl bg-bg-secondary border border-border p-3">
                        <div className="text-[10px] uppercase text-gray-500 mb-1">Σ Toplam</div>
                        <div className="text-lg font-bold text-accent-purple">{fmtNum(analysis.barData.reduce((s, d) => s + d.value, 0))}</div>
                      </div>
                      <div className="rounded-xl bg-bg-secondary border border-border p-3">
                        <div className="text-[10px] uppercase text-gray-500 mb-1">∅ Ortalama</div>
                        <div className="text-lg font-bold text-accent-cyan">{fmtNum(analysis.barData.reduce((s, d) => s + d.value, 0) / (analysis.barData.length || 1))}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.barData} layout="vertical" margin={{ top: 10, right: 70, bottom: 10, left: 10 }}>
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" horizontal={false} />
                          <XAxis type="number" stroke="#6b7280" fontSize={11} tickFormatter={fmtNum} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={180} />
                          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtNum(Number(v))} />
                          <Bar dataKey="value" fill="url(#barGrad)" radius={[0, 6, 6, 0]}
                               label={{ position: 'right', fill: '#9ca3af', fontSize: 11, formatter: (v: any) => fmtNum(Number(v)) }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={BarChart3} text="Bar chart üçün məlumat yoxdur" />
                )
              )}

              {expanded.type === 'pie' && (
                analysis.pieData.length > 1 ? (
                  <div className="h-full grid grid-cols-5 gap-6">
                    <div className="col-span-3 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analysis.pieData} dataKey="value" nameKey="name"
                               cx="50%" cy="50%" innerRadius="42%" outerRadius="72%"
                               paddingAngle={2} stroke="none"
                               label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                               labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}>
                            {analysis.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtNum(Number(v))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="col-span-2 flex flex-col gap-3 overflow-hidden">
                      <div className="rounded-xl bg-bg-secondary border border-border p-4 shrink-0">
                        <div className="text-[10px] uppercase text-gray-500 mb-1">Σ Ümumi</div>
                        <div className="text-3xl font-bold text-accent-purple">{fmtNum(analysis.pieData.reduce((s, d) => s + d.value, 0))}</div>
                        <div className="text-xs text-gray-500 mt-1">{analysis.pieData.length} kateqoriya üzrə</div>
                      </div>
                      <div className="flex-1 min-h-0 rounded-xl bg-bg-secondary border border-border overflow-hidden flex flex-col">
                        <div className="px-4 py-2 border-b border-border text-xs font-semibold text-gray-300 shrink-0">Bölgü cədvəli</div>
                        <div className="flex-1 overflow-y-auto">
                          {analysis.pieData.map((d, i) => {
                            const total = analysis.pieData.reduce((s, x) => s + x.value, 0);
                            const pct = total ? (d.value / total) * 100 : 0;
                            return (
                              <div key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-bg-hover transition-colors">
                                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                <div className="flex-1 text-xs text-gray-300 truncate" title={d.name}>{d.name}</div>
                                <div className="text-xs font-mono text-gray-400">{fmtNum(d.value)}</div>
                                <div className="text-[10px] text-gray-500 w-10 text-right">{pct.toFixed(1)}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={PieIcon} text="Bölgü üçün məlumat yoxdur" />
                )
              )}

              {expanded.type === 'table' && (
                <TableRenderer data={Array.isArray(fixedData?.data) ? fixedData.data : []} />
              )}
            </div>
          </div>
        )}
      </ExpandableModal>
    </div>
  );
};

// Alt komponentlər
interface StatCardProps {
  icon: any;
  label: string;
  hint?: string;
  value: string;
  color: 'cyan' | 'purple' | 'pink' | 'blue';
  highlight?: boolean;
  onClick?: () => void;
}

const colorMap = {
  cyan: 'from-accent-cyan/20 to-accent-cyan/5 text-accent-cyan border-accent-cyan/30',
  purple: 'from-accent-purple/20 to-accent-purple/5 text-accent-purple border-accent-purple/30',
  pink: 'from-accent-pink/20 to-accent-pink/5 text-accent-pink border-accent-pink/30',
  blue: 'from-accent-blue/20 to-accent-blue/5 text-accent-blue border-accent-blue/30',
};

const StatCard = ({ icon: Icon, label, hint, value, color, highlight, onClick }: StatCardProps) => {
  const c = colorMap[color].split(' ');
  return (
    <div onClick={onClick}
      className={`relative rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} border ${c[2]} p-4 group cursor-pointer transition-all hover:-translate-y-0.5 ${highlight ? 'ring-2 ring-accent-cyan/40 scale-[1.02]' : ''}`}
      title={hint}>
      <div className={`w-8 h-8 rounded-lg bg-bg-primary/50 flex items-center justify-center ${c[3]} mb-2`}>
        <Icon size={14} />
      </div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide truncate" title={label}>{label}</div>
      <div className={`mt-1 text-lg font-bold ${c[3]} truncate`}>{value}</div>
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

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
    <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
      <Icon size={20} className="opacity-40" />
    </div>
    <div className="text-sm">{text}</div>
  </div>
);

export default DatasetDetailPage;