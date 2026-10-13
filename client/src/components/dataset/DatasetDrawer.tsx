import { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { DatasetSummary, FetchedDataset } from '../../types/dataset';
import DynamicRenderer from './DynamicRenderer';
import { fetchDatasetContent } from '../../services/api';
import { useLang } from '../../i18n/LanguageContext';

interface Props {
  dataset: DatasetSummary | null;
  onClose: () => void;
}

const DatasetDrawer = ({ dataset, onClose }: Props) => {
  const [data, setData] = useState<FetchedDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLang();

 useEffect(() => {
    if (!dataset) { setData(null); setError(null); return; }
    setLoading(true); 
    setError(null);
    
    // ✅ metadataUrl yerinə dataset.id istifadə edirik
    fetchDatasetContent(dataset.id)
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
                  <span>{dataset.organization || '—'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border">
                    {dataset.format}
                  </span>
                  {data && (
                    <span>
                      • {t('drawer.rowsCount', { count: data.meta.totalRecords })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(dataset.resourceUrl || (dataset as any).storageUrl) && (
                  <a
        href={dataset.resourceUrl || (dataset as any).storageUrl} 
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-bg-primary border border-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30"
                    title={t('drawer.downloadFile')}
                    aria-label={t('drawer.downloadFile')}
                  >
                    <Download size={16} />
                  </a>
                )}
                <a
        href={dataset.resourceUrl || (dataset as any).storageUrl} 
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-bg-primary border border-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30"
                  title={t('drawer.apiMetadata')}
                  aria-label={t('drawer.apiMetadata')}
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-bg-primary border border-border text-gray-400 hover:text-red-400"
                  title={t('common.close')}
                  aria-label={t('common.close')}
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
                  <span className="text-sm text-gray-400">
                    {t('drawer.loadingData')}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={18} />
                  <div>
                    <div className="font-medium">{t('drawer.errorTitle')}</div>
                    <div className="text-xs mt-1 text-red-300/80">{error}</div>
                  </div>
                </div>
              )}

            {!loading && !error && data && data.meta.format === 'PDF' && data.meta.url && (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                    {t('drawer.pdfPreview') || 'PDF önizləmə'}
                </span>
                <a
                    href={data.meta.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent-cyan hover:underline flex items-center gap-1"
                >
                    <ExternalLink size={12} />
                    {t('drawer.openInNewTab') || 'Yeni tabda aç'}
                </a>
            </div>
            <iframe
                src={data.meta.url}
                title={dataset.title}
                className="w-full flex-1 min-h-[600px] rounded-lg border border-border bg-white"
            />
        </div>
    )}

    {/* ✅ Digər formatlar — DynamicRenderer */}
    {!loading && !error && data && data.meta.format !== 'PDF' && (
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