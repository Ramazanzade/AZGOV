import axios from 'axios';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { parseStringPromise } from 'xml2js';
import { Readable } from 'stream';
import iconv from 'iconv-lite';
import { cacheGet, cacheSet } from '../utils/cache';
import datasetsJson from '../config/datasets.json';

// ============================================================
//  TİPLƏR
// ============================================================
export interface DatasetSummary {
  id: string;
  name: string;
  title: string;
  organization: string;
  format: string;
  resourceUrl: string | null;
  metadataUrl: string;
  notes: string;
  tags: string[];
  lastUpdated: string;
  group: string;
}

export interface ParsedDataset {
  title: string;
  format: string;
  isGeoJSON: boolean;
  totalRecords: number;
  encoding?: string;
  corrupted?: boolean;
  corruptionCount?: number;
  data: any;
}

export interface DatasetRecord {
  title: string;
  slug: string;
  organization: string;
  metadataUrl: string;
  resourceName: string;
  format: string;
  resourceUrl: string;
  resourceId: string;
  key: string;
  group: string;
}

// ============================================================
//  ENCODING + SEPARATOR AŞKARLAMA
// ============================================================
const detectEncoding = (buffer: Buffer): { encoding: string; text: string } => {
  // 1. BOM yoxla
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return { encoding: 'utf-8-bom', text: buffer.slice(3).toString('utf-8') };
  }
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return { encoding: 'utf-16le', text: iconv.decode(buffer, 'utf-16le') };
  }
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return { encoding: 'utf-16be', text: iconv.decode(buffer, 'utf-16be') };
  }

  // 2. UTF-8 kimi yoxla
  const utf8 = buffer.toString('utf-8');
  const utf8Errors = (utf8.match(/\uFFFD/g) || []).length;

  if (utf8Errors === 0) {
    return { encoding: 'utf-8', text: utf8 };
  }

  // 3. Alternativ encoding-ləri yoxla
  const candidates: { enc: string; text: string; score: number }[] = [];
  const encodings = [
    'win1254',      // Turkish — Azərbaycan üçün uyğun
    'iso-8859-9',   // Latin-5 Turkish
    'win1251',      // Cyrillic
    'win1252',      // Western European
    'iso-8859-1',   // Latin-1
    'win1250'       // Central European
  ];

  encodings.forEach(enc => {
    try {
      const decoded = iconv.decode(buffer, enc);
      const errors = (decoded.match(/\uFFFD/g) || []).length;
      const azeChars = (decoded.match(/[əığşöüçƏIĞŞÖÜÇ]/g) || []).length;
      // Azərbaycan hərfləri bonus, xətalar cəza
      const score = errors - azeChars * 0.5;
      candidates.push({ enc, text: decoded, score });
    } catch { /* skip */ }
  });

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];

  console.log(`📝 Encoding: ${best.enc} (UTF-8 xəta: ${utf8Errors}, ən yaxşı xəta: ${best.score.toFixed(1)})`);

  return { encoding: best.enc, text: best.text };
};

const detectSeparator = (text: string): string => {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (semis > commas && semis > tabs) return ';';
  if (tabs > commas) return '\t';
  return ',';
};

// ============================================================
//  CSV PARSER
// ============================================================
const parseCSV = async (downloadUrl: string): Promise<{ rows: any[]; encoding: string }> => {
  const response = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: 200 * 1024 * 1024
  });

  const buffer = Buffer.from(response.data);
  const { encoding, text } = detectEncoding(buffer);
  const separator = detectSeparator(text);

  console.log(`📄 CSV: encoding=${encoding}, separator="${separator}", size=${(buffer.length / 1024).toFixed(1)}kb`);

  const rows = await new Promise<any[]>((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from([text]);

    stream
      .pipe(csv({
        separator,
        mapHeaders: ({ header }: { header: string }) =>
          header.trim().replace(/^\uFEFF/, '')
      }))
      .on('data', (row: any) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });

  return { rows, encoding };
};

// ============================================================
//  CORRUPTION DETECTION (bütün formatlara tətbiq olunur)
// ============================================================
const countCorruption = (data: any): number => {
  let count = 0;

  const check = (s: any) => {
    if (typeof s !== 'string' || s.length < 3) return;
    // '?' hərfin yanında (məs: "V?zif?si", "Mürs?lov")
    const m = s.match(/[A-Za-zÇçĞğŞşİıÖöÜü]\?[A-Za-zÇçĞğŞşİıÖöÜü]/g);
    if (m) count += m.length;
  };

  const walk = (obj: any, depth = 0) => {
    if (depth > 3 || count > 500) return;
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.slice(0, 200).forEach(item => walk(item, depth + 1));
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(v => {
        if (typeof v === 'string') check(v);
        else if (v && typeof v === 'object') walk(v, depth + 1);
      });
    }
  };

  walk(data);
  return count;
};

const applyCorruptionCheck = (result: ParsedDataset): ParsedDataset => {
  // GeoJSON üçün yoxlama mənasızdır
  if (result.isGeoJSON || result.format === 'ERROR') return result;

  const corruptionCount = countCorruption(result.data);
  return {
    ...result,
    corruptionCount,
    corrupted: corruptionCount > 5
  };
};

// ============================================================
//  BÜTÜN DATASETLƏR
// ============================================================
export const fetchAllPackages = async (): Promise<DatasetRecord[]> => {
  const cacheKey = 'all_datasets_excel';
  const cached = cacheGet<DatasetRecord[]>(cacheKey);
  if (cached) return cached;

  const result = datasetsJson as DatasetRecord[];
  cacheSet(cacheKey, result, 60 * 60 * 1000);
  return result;
};

// ============================================================
//  ƏSAS FUNKSIYA
// ============================================================
export const fetchAndParseDataset = async (metadataUrl: string): Promise<ParsedDataset> => {
  // Cache yoxla
  const cacheKey = `parsed_${metadataUrl}`;
  const cached = cacheGet<ParsedDataset>(cacheKey);
  if (cached) return cached;

  // 1. Metadata
  const metaRes = await axios.get(metadataUrl, { timeout: 30000 });

  if (!metaRes.data?.success) {
    throw new Error('Metadata API-dən məlumat alına bilmədi');
  }

  const pkg = metaRes.data.result;
  const resources = pkg.resources || [];

  if (resources.length === 0) {
    throw new Error('Bu datasetdə heç bir resource yoxdur');
  }

  // 2. Resource seçimi
  const resource =
    resources.find((r: any) =>
      ['CSV', 'JSON', 'GEOJSON', 'XLSX', 'XLS', 'XML'].includes((r.format || '').toUpperCase())
    ) || resources[0];

  const format = (resource.format || 'UNKNOWN').toUpperCase();
  const downloadUrl = resource.url;
  const title = pkg.title || pkg.name || 'Adsız dataset';

  if (!downloadUrl) {
    throw new Error('Resource URL tapılmadı');
  }

  console.log(`🎯 Dataset: "${title}" [${format}]`);

  // 3. Format-a görə parse et
  try {
    let result: ParsedDataset;

    // ---------- CSV ----------
    if (format === 'CSV' || format === 'TXT') {
      const { rows, encoding } = await parseCSV(downloadUrl);
      result = {
        title,
        format,
        isGeoJSON: false,
        totalRecords: rows.length,
        encoding,
        data: rows
      };
    }

    // ---------- JSON / GeoJSON ----------
    else if (format === 'JSON' || format === 'GEOJSON') {
      const fileRes = await axios.get(downloadUrl, { timeout: 60000 });
      const jsonData = fileRes.data;

      let data: any;
      let isGeoJSON = false;

      if (jsonData?.type === 'FeatureCollection') {
        isGeoJSON = true;
        data = jsonData;
      } else if (Array.isArray(jsonData)) {
        data = jsonData;
      } else if (jsonData?.results) {
        data = jsonData.results;
      } else if (jsonData?.data) {
        data = jsonData.data;
      } else {
        data = [jsonData];
      }

      const totalRecords = isGeoJSON
        ? (jsonData.features?.length || 0)
        : (Array.isArray(data) ? data.length : 1);

      result = {
        title,
        format,
        isGeoJSON,
        totalRecords,
        encoding: 'utf-8',
        data
      };
    }

    // ---------- XLSX / XLS ----------
    else if (format === 'XLSX' || format === 'XLS') {
      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 200 * 1024 * 1024
      });

      const workbook = XLSX.read(Buffer.from(fileRes.data), { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      result = {
        title,
        format,
        isGeoJSON: false,
        totalRecords: data.length,
        encoding: 'utf-8',
        data
      };
    }

    // ---------- XML ----------
    else if (format === 'XML') {
      const fileRes = await axios.get(downloadUrl, {
        responseType: 'text',
        timeout: 60000
      });

      const parsed = await parseStringPromise(fileRes.data, {
        explicitArray: false,
        trim: true
      });

      const rootKey = Object.keys(parsed)[0];
      const root = parsed[rootKey];
      let data: any[] = [];

      if (Array.isArray(root)) {
        data = root;
      } else if (typeof root === 'object') {
        const childKey = Object.keys(root).find(k => Array.isArray(root[k]));
        if (childKey) {
          data = root[childKey];
        } else {
          data = [root];
        }
      }

      result = {
        title,
        format,
        isGeoJSON: false,
        totalRecords: data.length,
        encoding: 'utf-8',
        data
      };
    }

    // ---------- Dəstəklənməyən ----------
    else {
      throw new Error(`Dəstəklənməyən format: ${format}`);
    }

    // Corruption check bütün formatlara tətbiq olunur
    const checked = applyCorruptionCheck(result);

    if (checked.corrupted) {
      console.warn(`⚠️  Dataset "${title}" xarabdır — ${checked.corruptionCount} yer '?' işarəsi var`);
    }

    // Cache-ə yalnız yaxşı datanı yaz
    cacheSet(cacheKey, checked, 30 * 60 * 1000);
    return checked;

  } catch (parseErr: any) {
    console.error(`❌ Parse xətası [${format}]:`, parseErr.message);

    // Xəta halında da 200 qaytar
    return {
      title,
      format: 'ERROR',
      isGeoJSON: false,
      totalRecords: 0,
      data: {
        _error: parseErr.message,
        _format: format,
        _downloadUrl: downloadUrl
      }
    };
  }
};