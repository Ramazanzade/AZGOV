import { Link } from 'react-router-dom';
import { Database, FileText, Map as MapIcon, Clock, Tag } from 'lucide-react';
import { DatasetSummary } from '../../types/dataset';

interface Props { dataset: DatasetSummary }

const formatColor = (fmt: string) => {
  switch (fmt) {
    case 'CSV': return 'bg-green-500/10 text-green-400 border-green-500/30';
    case 'JSON': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'GEOJSON': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'XLSX':
    case 'XLS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'XML': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
};

const formatIcon = (fmt: string) => {
  if (fmt === 'GEOJSON') return <MapIcon size={12} />;
  if (fmt === 'JSON') return <FileText size={12} />;
  return <Database size={12} />;
};

const DatasetCard = ({ dataset }: Props) => {
  return (
    <Link
      to={`/dataset/${dataset.id}`}
       state={{ dataset }} 
      className="block rounded-xl bg-bg-card border border-border p-4 hover:border-accent-cyan/50 hover:bg-bg-hover transition-all group"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 flex items-center justify-center flex-shrink-0">
          <Database size={16} className="text-accent-cyan" />
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${formatColor(dataset.format)}`}>
          {formatIcon(dataset.format)}
          {dataset.format}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 mb-2 group-hover:text-accent-cyan transition-colors">
        {dataset.title}
      </h3>

      <div className="space-y-1.5 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <Tag size={11} />
          <span className="truncate">{dataset.organization}</span>
        </div>
        {dataset.lastUpdated && (
          <div className="flex items-center gap-1.5">
            <Clock size={11} />
            <span>{new Date(dataset.lastUpdated).toLocaleDateString('az')}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default DatasetCard;