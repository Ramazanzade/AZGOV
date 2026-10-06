import { useEffect, useState } from 'react';
import { fetchDatasetByUrlCached } from '../services/api';
import { FetchedDataset } from '../types/dataset';

// Timeout wrapper
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
};

export const useBatchFetch = (urls: (string | undefined)[]) => {
  const [data, setData] = useState<Record<string, FetchedDataset | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const valid = urls.filter((u): u is string => !!u);
    if (valid.length === 0) { setLoading(false); return; }

    let active = true;
    setLoading(true);

    Promise.all(
      valid.map(url =>
        withTimeout(fetchDatasetByUrlCached(url), 30000)  // 30 saniyə
          .then(d => [url, d] as [string, FetchedDataset])
          .catch(() => [url, null] as [string, null])
      )
    ).then(results => {
      if (!active) return;
      const map: Record<string, FetchedDataset | null> = {};
      results.forEach(([url, d]) => { map[url] = d; });
      setData(map);
      setLoading(false);
    });

    return () => { active = false; };
  }, [urls.join('|')]);

  return { data, loading };
};