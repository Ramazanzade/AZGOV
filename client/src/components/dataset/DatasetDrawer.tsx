import { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { DatasetSummary, FetchedDataset } from '../../types/dataset';
import { fetchDatasetByUrl } from '../../services/api';
import DynamicRenderer from './DynamicRenderer';

interface Props {
  dataset: DatasetSummary | null;
  onClose: () => void;
}

const DatasetDrawer = ({ dataset, onClose }: Props) => {
  const [data, setData] = useState<FetchedDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset) { setData(null); setError(null); return; }
    setLoading(true); setError(null);
    fetchDatasetByUrl(dataset.metadataUrl)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dataset]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${
          dataset ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-[80vw] max-w-5xl bg-bg-secondary border-l border-border z-50 flex flex-col transition-transform duration-300 ${
          dataset ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {dataset && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-border gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-100 line-clamp-2">
                  {dataset.title}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                  <span>{dataset.organization}</span>
                  <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border">
                    {dataset.format}
                  </span>
                  {data && <span>• {data.meta.totalRecords} sətir</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {dataset.resourceUrl && (
                  <a
                    href={dataset.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-bg-primary border border-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30"
                    title="Faylı yüklə"
                  >
                    <Download size={16} />
                  </a>
                )}
                <a
                  href={dataset.metadataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-bg-primary border border-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30"
                  title="API metadata"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-bg-primary border border-border text-gray-400 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-5">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={28} className="text-accent-cyan animate-spin" />
                  <span className="text-sm text-gray-400">Data yüklənir...</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={18} />
                  <div>
                    <div className="font-medium">Xəta baş verdi</div>
                    <div className="text-xs mt-1 text-red-300/80">{error}</div>
                  </div>
                </div>
              )}

              {!loading && !error && data && (
                <DynamicRenderer
                  format={data.meta.format}
                  isGeoJSON={data.meta.isGeoJSON}
                  data={data.data}
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DatasetDrawer;