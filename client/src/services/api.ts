// services/api.ts
import axios from 'axios';
import { DatasetSummary, FetchedDataset } from '../types/dataset';

const api = axios.create({ baseURL: '/api/v1/dashboard', timeout: 90000 });

// In-memory cache (sürətli)
const memCache = new Map<string, { data: any; expires: number }>();

// ✅ Yeni: localStorage-dan oxu
function readLS(key: string): { data: any; expires: number } | null {
    try {
        const raw = localStorage.getItem(`azdatam_${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() > parsed.expires) {
            localStorage.removeItem(`azdatam_${key}`);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

// ✅ Yeni: localStorage-a yaz
function writeLS(key: string, value: { data: any; expires: number }) {
    try {
        localStorage.setItem(`azdatam_${key}`, JSON.stringify(value));
    } catch (e) {
        // localStorage dolubsa, ən köhnə açarları sil
        console.warn('localStorage dolub, təmizlənir...');
        Object.keys(localStorage)
            .filter(k => k.startsWith('azdatam_'))
            .slice(0, 5)
            .forEach(k => localStorage.removeItem(k));
        try { localStorage.setItem(`azdatam_${key}`, JSON.stringify(value)); } catch {}
    }
}

// ✅ Yeni: 2 qatlı cache (memory + localStorage)
const cached = async <T>(
    key: string, 
    ttlMs: number, 
    fetcher: () => Promise<T>
): Promise<T> => {
    // 1. Memory cache-ə bax
    const memHit = memCache.get(key);
    if (memHit && Date.now() < memHit.expires) return memHit.data;

    // 2. localStorage-a bax
    const lsHit = readLS(key);
    if (lsHit) {
        memCache.set(key, lsHit);  // Memory-ə də yaz (sürətli olsun)
        return lsHit.data;
    }

    // 3. API-dən çək
    const data = await fetcher();
    const entry = { data, expires: Date.now() + ttlMs };
    memCache.set(key, entry);
    writeLS(key, entry);
    return data;
};

// ─────────────────────────────────────────────
// Datasets
// ─────────────────────────────────────────────
export const getDatasets = async (rows = 5000): Promise<DatasetSummary[]> => {
    try {
        const res = await api.get('/datasets', { params: { rows } });
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        return payload.data || payload.datasets || payload.items || [];
    } catch (error) {
        console.error('getDatasets xətası:', error);
        return [];
    }
};

// ✅ 30 dəqiqə cache (datasets tez-tez dəyişmir)
export const getDatasetsCached = (rows = 5000): Promise<DatasetSummary[]> =>
    cached(`datasets_${rows}`, 30 * 60 * 1000, () => getDatasets(rows));

// ─────────────────────────────────────────────
// Dataset content (PDF, Excel, CSV, ZIP)
// ─────────────────────────────────────────────
export const fetchDatasetContent = async (id: number): Promise<FetchedDataset> => {
    const res = await api.get(`/${id}/content`);
    const payload = res.data;

    if (payload && payload.type === 'PDF') {
        return {
            meta: {
                format: 'PDF',
                isGeoJSON: false,
                totalRecords: 0,
                url: payload.url,
            },
            data: null,
        };
    }
    // ✅ Xarici URL (EXTERNAL)
if (payload && payload.type === 'EXTERNAL') {
    return {
        meta: {
            format: payload.format || 'JSON',
            isGeoJSON: false,
            totalRecords: 0,
            url: payload.url,
            fileName: payload.title,
        },
        data: null,
    };
}
    // ✅ GeoJSON FeatureCollection (birbaşa cavab)
    if (payload && payload.type === 'FeatureCollection' && Array.isArray(payload.features)) {
        return {
            meta: {
                format: 'GeoJSON',
                isGeoJSON: true,
                totalRecords: payload.features.length,
            },
            data: payload,
        };
    }

    // ✅ GeoJSON Feature (tək)
    if (payload && payload.type === 'Feature') {
        return {
            meta: {
                format: 'GeoJSON',
                isGeoJSON: true,
                totalRecords: 1,
            },
            data: { type: 'FeatureCollection', features: [payload] },
        };
    }
        // ✅ Array of Features (GeoJSON massivi)
    if (
        Array.isArray(payload) &&
        payload.length > 0 &&
        payload[0]?.type === 'Feature' &&
        payload[0]?.geometry
    ) {
        return {
            meta: {
                format: 'GeoJSON',
                isGeoJSON: true,
                totalRecords: payload.length,
            },
            data: { type: 'FeatureCollection', features: payload },
        };
    }
    if (payload && payload.type === 'DOWNLOAD') {
    return {
      meta: {
        format: payload.format || 'XLSX',
        isGeoJSON: false,
        totalRecords: 0,
        url: payload.url,
      },
      data: null,
    };
  }

    const isGeoJSON = payload &&
        typeof payload === 'object' &&
        !Array.isArray(payload) &&
        (payload.type === 'FeatureCollection' || payload.type === 'Feature');

    return {
        meta: {
            format: 'JSON',
            isGeoJSON,
            totalRecords: Array.isArray(payload) ? payload.length : 0,
        },
        data: payload,
    };
};

// ⚠️ PDF presigned URL-lər 1 saat etibarlıdır — cache etmə!
// Digər formatlar üçün 30 dəqiqə cache
export const fetchDatasetContentCached = (id: number): Promise<FetchedDataset> => {
    // Əvvəlcə memory-də varsa, format-a bax
    const hit  = memCache.get(`content_${id}`);
    if (hit && hit.data?.meta?.format === 'PDF') {
        // PDF-ni cache-dən sil ki, presigned URL yenilənsin
        memCache.delete(`content_${id}`);
        localStorage.removeItem(`azdatam_content_${id}`);
    }
    return cached(`content_${id}`, 30 * 60 * 1000, () => fetchDatasetContent(id));
};

export const fetchDatasetByUrl = fetchDatasetContent as any;
export const fetchDatasetByUrlCached = fetchDatasetContentCached;