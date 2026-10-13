// services/api.ts
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

// ✅ DÜZƏLİŞ: Backend birbaşa array qaytarır
export const getDatasets = async (rows = 5000): Promise<DatasetSummary[]> => {
    try {
        const res = await api.get('/datasets', { params: { rows } });
        // Backend array qaytarırsa birbaşa, obyekt qaytarırsa .data
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        return payload.data || payload.datasets || payload.items || [];
    } catch (error) {
        console.error('getDatasets xətası:', error);
        return [];
    }
};

export const getDatasetsCached = (rows = 500): Promise<DatasetSummary[]> =>
    cached(`datasets_${rows}`, 10 * 60 * 1000, () => getDatasets(rows));

// ✅ DÜZƏLİŞ: Artıq URL yerinə ID ilə çağırırıq
export const fetchDatasetContent = async (id: number): Promise<FetchedDataset> => {
    const res = await api.get(`/${id}/content`);
    const payload = res.data;

    // PDF üçün xüsusi hal
    if (payload && payload.type === 'PDF') {
        return {
            meta: {
                format: 'PDF',
                isGeoJSON: false,
                totalRecords: 0,
                url: payload.url,
            } as any,
            data: null as any,
        };
    }

    // Digər formatlar üçün
    const isGeoJSON = 
        payload && 
        typeof payload === 'object' && 
        !Array.isArray(payload) && 
        (payload.type === 'FeatureCollection' || payload.type === 'Feature');

    return {
        meta: {
            format: 'JSON',
            isGeoJSON,
            totalRecords: Array.isArray(payload) ? payload.length : 0,
        } as any,
        data: payload,
    };
};

export const fetchDatasetContentCached = (id: number): Promise<FetchedDataset> =>
    cached(`content_${id}`, 15 * 60 * 1000, () => fetchDatasetContent(id));

// Köhnə funksiyanı saxlayırıq (əgər başqa yerdə istifadə olunursa)
export const fetchDatasetByUrl = fetchDatasetContent as any;
export const fetchDatasetByUrlCached = fetchDatasetContentCached as any;