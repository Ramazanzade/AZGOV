import axios from 'axios';
import { DatasetSummary, FetchedDataset } from '../types/dataset';
const cache = new Map<string, { data: any; expires: number }>();

const api = axios.create({ baseURL: '/api/v1/dashboard', timeout: 90000 });
const cached = async <T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> => {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expires) return hit.data;
  const data = await fetcher();
  cache.set(key, { data, expires: Date.now() + ttlMs });
  return data;
};


export const getDatasetsCached = (rows = 500): Promise<DatasetSummary[]> =>
  cached(`datasets_${rows}`, 10 * 60 * 1000, () => getDatasets(rows));

export const fetchDatasetByUrlCached = (url: string): Promise<FetchedDataset> =>
  cached(`fetch_${url}`, 15 * 60 * 1000, () => fetchDatasetByUrl(url)); 

export const getDatasets = async (rows = 500): Promise<DatasetSummary[]> => {
  const res = await api.get('/datasets', { params: { rows } });
  return res.data.data;
};

export const fetchDatasetByUrl = async (metadataUrl: string): Promise<FetchedDataset> => {
  const res = await api.get('/fetch-data', { params: { url: metadataUrl } });
  return { meta: res.data.meta, data: res.data.data };
};