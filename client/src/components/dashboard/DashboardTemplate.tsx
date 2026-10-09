import { useMemo } from 'react';
import { Loader2, Info } from 'lucide-react';
import FilterPanel from '../layout/FilterPanel';
import StatCard from './StatCard';
import ChartRenderer from '../renderers/ChartRenderer';
import MapRenderer from '../renderers/MapRenderer';
import TableRenderer from '../renderers/TableRenderer';
import { useBatchFetch } from '../../hooks/useBatchFetch';
import { DashboardConfig } from '../../config/dashboards';
import { useLang } from '../../i18n/LanguageContext';

interface Props { config: DashboardConfig }

const DashboardTemplate = ({ config }: Props) => {
  const Icon = config.icon;
  const { t } = useLang();                                  // ← YENİ

  // Stat kartları üçün URL-lər
  const statUrls = useMemo(
    () => config.statCards.map(c => c.metadataUrl),
    [config]
  );
  const { data: statData, loading: statLoading } = useBatchFetch(statUrls);

  // Chart URL-ləri
  const chartUrls = useMemo(
    () => config.charts.map(c => c.metadataUrl),
    [config]
  );
  const { data: chartData, loading: chartLoading } = useBatchFetch(chartUrls);

  // Xəritə URL-i (varsa)
  const mapUrls = useMemo(
    () => (config.map ? [config.map.metadataUrl] : []),
    [config]
  );
  const { data: mapData, loading: mapLoading } = useBatchFetch(mapUrls);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Başlıq */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <Icon size={20} className={config.iconColor} />
          </div>
          <p className="text-sm text-gray-400">{config.subtitle}</p>
        </div>

        {/* Stat kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {config.statCards.map(cfg => (
            <StatCard
              key={cfg.id}
              config={cfg}
              dataset={statData[cfg.metadataUrl] || null}
              loading={statLoading}
            />
          ))}
        </div>

        {/* Chart-lar (ilk 2-si 2+1 grid, qalanları tam en) */}
        {config.charts.length >= 2 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2 h-[70vh] rounded-xl bg-bg-card border border-border p-4 flex flex-col">
              <div className="text-sm font-semibold mb-3">{config.charts[0].title}</div>
              <div className="flex-1 min-h-0">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-accent-cyan" />
                  </div>
                ) : chartData[config.charts[0].metadataUrl] ? (
                  <ChartRenderer data={chartData[config.charts[0].metadataUrl]!.data} />
                ) : (
                  <div className="text-gray-500 text-xs">{t('common.loadError')}</div>
                )}
              </div>
            </div>

            <div className="h-[70vh] rounded-xl bg-bg-card border border-border p-4 flex flex-col">
              <div className="text-sm font-semibold mb-3">{config.charts[1].title}</div>
              <div className="flex-1 min-h-0">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-accent-cyan" />
                  </div>
                ) : chartData[config.charts[1].metadataUrl] ? (
                  <ChartRenderer data={chartData[config.charts[1].metadataUrl]!.data} />
                ) : (
                  <div className="text-gray-500 text-xs">{t('common.loadError')}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Qalan chart-lar */}
        {config.charts.slice(2).map(chart => (
          <div
            key={chart.id}
            className="h-[60vh] rounded-xl bg-bg-card border border-border p-4 mb-6 flex flex-col"
          >
            <div className="text-sm font-semibold mb-3">{chart.title}</div>
            <div className="flex-1 min-h-0">
              {chartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-accent-cyan" />
                </div>
              ) : chartData[chart.metadataUrl] ? (
                <ChartRenderer data={chartData[chart.metadataUrl]!.data} />
              ) : (
                <div className="text-gray-500 text-xs">{t('common.loadError')}</div>
              )}
            </div>
          </div>
        ))}

        {/* Xəritə */}
        {config.map && (
          <div className="h-[60vh] rounded-xl bg-bg-card border border-border p-4 mb-6 flex flex-col">
            <div className="text-sm font-semibold mb-3">{config.map.title}</div>
            <div className="flex-1 min-h-0 overflow-hidden rounded-lg">
              {mapLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-accent-cyan" />
                </div>
              ) : mapData[config.map.metadataUrl]?.meta.isGeoJSON ? (
                <MapRenderer data={mapData[config.map.metadataUrl]!.data} />
              ) : mapData[config.map.metadataUrl] ? (
                <TableRenderer data={mapData[config.map.metadataUrl]!.data} />
              ) : (
                <div className="text-gray-500 text-xs p-2">{t('common.loadError')}</div>
              )}
            </div>
          </div>
        )}

        {/* Cədvəl (stat kartların xam datası) */}
        <div className="rounded-xl bg-bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <span className="font-semibold text-sm">{t('common.latestData')}</span>
            <Info size={14} className="text-gray-500" />
          </div>
          <div className="p-4">
            {statLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-accent-cyan" />
              </div>
            ) : (
              <TableRenderer
                data={config.statCards
                  .map(c => {
                    const d = statData[c.metadataUrl];
                    if (!d || !Array.isArray(d.data)) return null;
                    return d.data.slice(0, 20);
                  })
                  .filter(Boolean)
                  .flat() as any[]}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardTemplate;