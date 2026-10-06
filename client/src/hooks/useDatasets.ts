import { useEffect, useState, useMemo } from 'react';
import { getDatasets, getDatasetsCached } from '../services/api';
import { DatasetSummary } from '../types/dataset';

export const useDatasets = (search = '', formatFilter = 'ALL') => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let freshLoaded = false;
    setLoading(true);

    // 1. Cache varsa dərhal göstər
    getDatasetsCached()
      .then(data => {
        if (active && !freshLoaded && data?.length) {
          setDatasets(data);
          setLoading(false);
        }
      })
      .catch(() => { /* cache xətası kritik deyil */ });

    // 2. Təzə datanı çək və əvəz et
    getDatasets()
      .then(data => {
        if (active) {
          freshLoaded = true;
          setDatasets(data);
          setError(null);
        }
      })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return datasets.filter(d => {
      const matchSearch = !q ||
        d.title.toLowerCase().includes(q) ||
        d.organization.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q));
      const matchFormat = formatFilter === 'ALL' || d.format === formatFilter;
      return matchSearch && matchFormat;
    });
  }, [datasets, search, formatFilter]);

  return { datasets, filtered, loading, error };
};