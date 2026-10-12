import { useMemo, useState } from 'react';
import { Loader2, Info, RefreshCw, Sparkles, Maximize2 } from 'lucide-react';
import StatCard from './StatCard';
import ChartRenderer from '../renderers/ChartRenderer';
import MapRenderer from '../renderers/MapRenderer';
import TableRenderer from '../renderers/TableRenderer';
import ExpandableModal from '../ui/ExpandableModal';
import { useBatchFetch } from '../../hooks/useBatchFetch';
import { DashboardConfig } from '../../config/dashboards';
import { useLang } from '../../i18n/LanguageContext';

interface Props { config: DashboardConfig }

// Modal state tipi
type Expanded =
  | { kind: 'stat';   index: number }
  | { kind: 'chart';  index: number }
  | { kind: 'map' }
  | { kind: 'table' }
  | null;

const SectionHeader = ({
  title, icon: Icon, accent = 'text-accent-cyan', right,
}: any) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className={`w-1 h-4 rounded-full bg-current ${accent}`} />
      {Icon && <Icon size={14} className={accent} />}
      <span className="text-sm font-semibold text-gray-100">{title}</span>
    </div>
    {right}
  </div>
);

const ChartBox = ({
  title, accent, loading, error, children, height = 'h-[70vh]', onExpand,
}: any) => (
  <div
    onClick={onExpand}
    className={`${height} rounded-xl bg-bg-card border border-border p-4 flex flex-col
                shadow-card hover:border-accent-cyan/40 transition-all cursor-pointer
                group/chart animate-slide-up relative`}
  >
    {/* Expand işarəsi — hover olanda görünür */}
    <div className="absolute top-3 right-3 opacity-0 group-hover/chart:opacity-100 transition-opacity
                    w-7 h-7 rounded-md bg-bg-primary/80 border border-border
                    flex items-center justify-center text-gray-400">
      <Maximize2 size={12} />
    </div>

    <SectionHeader title={title} accent={accent} />
    <div className="flex-1 min-h-0">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-accent-cyan" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-xs">{error}</div>
      ) : children}
    </div>
  </div>
);

const DashboardTemplate = ({ config }: Props) => {
  const Icon = config.icon;
  const { t } = useLang();

  const [expanded, setExpanded] = useState<Expanded>(null);

  const statUrls = useMemo(() => config.statCards.map(c => c.metadataUrl), [config]);
  const { data: statData, loading: statLoading, refetch: refetchStats } = useBatchFetch(statUrls) as any;

  const chartUrls = useMemo(() => config.charts.map(c => c.metadataUrl), [config]);
  const { data: chartData, loading: chartLoading } = useBatchFetch(chartUrls);

  const mapUrls = useMemo(() => (config.map ? [config.map.metadataUrl] : []), [config]);
  const { data: mapData, loading: mapLoading } = useBatchFetch(mapUrls);

  const allRows = config.statCards
    .map(c => {
      const d = statData[c.metadataUrl];
      if (!d || !Array.isArray(d.data)) return null;
      return d.data.slice(0, 20);
    })
    .filter(Boolean)
    .flat() as any[];

  // Modal üçün məzmun
  const renderModalContent = () => {
    if (!expanded) return null;

    if (expanded.kind === 'stat') {
      const cfg = config.statCards[expanded.index];
      const ds  = statData[cfg.metadataUrl];
      return <TableRenderer data={Array.isArray(ds?.data) ? ds.data : []} />;
    }

    if (expanded.kind === 'chart') {
      const chart = config.charts[expanded.index];
      const d = chartData[chart.metadataUrl];
      return d ? <ChartRenderer data={d.data} /> : null;
    }

    if (expanded.kind === 'map' && config.map) {
      const d = mapData[config.map.metadataUrl];
      if (!d) return null;
      return d.meta.isGeoJSON
        ? <MapRenderer data={d.data} />
        : <TableRenderer data={d.data} />;
    }

    if (expanded.kind === 'table') {
      return <TableRenderer data={allRows} />;
    }
    return null;
  };

  // Modal başlığı
  const modalTitle = (() => {
    if (!expanded) return '';
    if (expanded.kind === 'stat')  return config.statCards[expanded.index].title;
    if (expanded.kind === 'chart') return config.charts[expanded.index].title;
    if (expanded.kind === 'map')   return config.map?.title || '';
    if (expanded.kind === 'table') return t('common.latestData');
    return '';
  })();

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto animate-fade-in">

        {/* Başlıq */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
              <Icon size={20} className={config.iconColor} />
            </div>
            <p className="text-sm text-gray-400">{config.subtitle}</p>
          </div>
          <button
            onClick={() => refetchStats?.()}
            disabled={statLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                       bg-bg-card border border-border text-gray-300
                       hover:bg-bg-hover hover:border-accent-cyan/40 hover:text-accent-cyan
                       disabled:opacity-50 transition-all"
          >
            <RefreshCw size={13} className={statLoading ? 'animate-spin' : ''} />
            Yenilə
          </button>
        </div>

        {/* Stat kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {config.statCards.map((cfg, i) => (
            <StatCard
              key={cfg.id}
              config={cfg}
              dataset={statData[cfg.metadataUrl] || null}
              loading={statLoading}
              onExpand={() => setExpanded({ kind: 'stat', index: i })}
            />
          ))}
        </div>

        {/* Chart-lar 0-1 */}
        {config.charts.length >= 2 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="col-span-2">
              <ChartBox
                title={config.charts[0].title}
                accent="text-accent-cyan"
                loading={chartLoading}
                error={!chartData[config.charts[0].metadataUrl] ? t('common.loadError') : null}
                onExpand={() => setExpanded({ kind: 'chart', index: 0 })}
              >
                <ChartRenderer data={chartData[config.charts[0].metadataUrl]!.data} />
              </ChartBox>
            </div>
            <ChartBox
              title={config.charts[1].title}
              accent="text-accent-purple"
              loading={chartLoading}
              error={!chartData[config.charts[1].metadataUrl] ? t('common.loadError') : null}
              onExpand={() => setExpanded({ kind: 'chart', index: 1 })}
            >
              <ChartRenderer data={chartData[config.charts[1].metadataUrl]!.data} />
            </ChartBox>
          </div>
        )}

        {/* Qalan chart-lar */}
        {config.charts.slice(2).map((chart, i) => {
          const realIndex = i + 2;
          return (
            <div key={chart.id} className="mb-8">
              <ChartBox
                title={chart.title}
                accent={['text-accent-pink', 'text-accent-blue'][i % 2]}
                height="h-[60vh]"
                loading={chartLoading}
                error={!chartData[chart.metadataUrl] ? t('common.loadError') : null}
                onExpand={() => setExpanded({ kind: 'chart', index: realIndex })}
              >
                <ChartRenderer data={chartData[chart.metadataUrl]!.data} />
              </ChartBox>
            </div>
          );
        })}

        {/* Xəritə */}
        {config.map && (
          <div className="mb-8">
            <ChartBox
              title={config.map.title}
              accent="text-accent-blue"
              height="h-[60vh]"
              loading={mapLoading}
              error={!mapData[config.map.metadataUrl] ? t('common.loadError') : null}
              onExpand={() => setExpanded({ kind: 'map' })}
            >
              <div className="h-full overflow-hidden rounded-lg">
                {mapData[config.map.metadataUrl]?.meta.isGeoJSON ? (
                  <MapRenderer data={mapData[config.map.metadataUrl]!.data} />
                ) : (
                  <TableRenderer data={mapData[config.map.metadataUrl]!.data} />
                )}
              </div>
            </ChartBox>
          </div>
        )}

        {/* Cədvəl */}
        <div
          onClick={() => setExpanded({ kind: 'table' })}
          className="rounded-xl bg-bg-card border border-border overflow-hidden
                     shadow-card hover:border-accent-cyan/40 transition-all
                     cursor-pointer group/table animate-slide-up relative"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent-cyan" />
              <span className="font-semibold text-sm">{t('common.latestData')}</span>
              <Info size={13} className="text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              {allRows.length > 0 && (
                <span className="text-[10px] text-gray-500 font-mono">{allRows.length} sətir</span>
              )}
              <div className="opacity-0 group-hover/table:opacity-100 transition-opacity
                              w-6 h-6 rounded-md bg-bg-primary/80 border border-border
                              flex items-center justify-center text-gray-400">
                <Maximize2 size={11} />
              </div>
            </div>
          </div>
          <div className="p-4">
            {statLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-accent-cyan" />
              </div>
            ) : (
              <TableRenderer data={allRows} />
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <ExpandableModal
        open={expanded !== null}
        onClose={() => setExpanded(null)}
        title={modalTitle}
        subtitle={config.title}
      >
        {renderModalContent()}
      </ExpandableModal>
    </div>
  );
};

export default DashboardTemplate;