import { useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';
import TableRenderer from '../renderers/TableRenderer';
import MapRenderer from '../renderers/MapRenderer';
import ChartRenderer from '../renderers/ChartRenderer';
import { useLang } from '../../i18n/LanguageContext';

interface Props { format: string; isGeoJSON: boolean; data: any }

type ViewMode = 'chart' | 'table';

const DynamicRenderer = ({ format, isGeoJSON, data }: Props) => {
  const [view, setView] = useState<ViewMode>('table');
  const { t } = useLang();

  if (isGeoJSON || format === 'GEOJSON') return <MapRenderer data={data} />;

  const canChart = Array.isArray(data) && data.length > 0 &&
    ['CSV', 'XLSX', 'XLS', 'JSON'].includes(format);

  const isJsonObject = format === 'JSON' && !Array.isArray(data);

  if (isJsonObject) {
    return (
      <pre className="text-xs text-gray-400 bg-bg-primary p-3 rounded-lg overflow-auto max-h-[70vh] border border-border">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  if (!canChart) return <TableRenderer data={Array.isArray(data) ? data : [data]} />;

  return (
    <div>
      <div className="flex items-center gap-1 mb-4 bg-bg-primary border border-border rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('chart')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
            view === 'chart' ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 size={12} /> {t('chart.chart')}
        </button>
        <button
          onClick={() => setView('table')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
            view === 'table' ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Table2 size={12} /> {t('chart.table')}
        </button>
      </div>

      {view === 'chart' ? <ChartRenderer data={data} /> : <TableRenderer data={data} />}
    </div>
  );
};

export default DynamicRenderer;