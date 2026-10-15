import 'dotenv/config';  // ← ƏN İLK SƏTİR
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { S3Client, GetObjectCommand , PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const accessKey = process.env.NEON_STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.NEON_STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET || process.env.NEON_STORAGE_BUCKET || 'azgov-excel-files';

// Debug logları
console.log('🔑 S3 Config yoxlanılır:');
console.log('   endpoint:', endpoint ? '✓' : '✗');
console.log('   accessKey:', accessKey ? `✓ (${accessKey.substring(0, 12)}...)` : '✗');
console.log('   secretKey:', secretKey ? `✓ (${secretKey.substring(0, 12)}...)` : '✗');
console.log('   region:', region);
console.log('   bucket:', bucket);

if (!accessKey || !secretKey || !endpoint) {
    console.error('❌ S3 kredensialları natamamdır! .env faylını yoxlayın.');
}
 
const s3 = new S3Client({
    endpoint: endpoint,
    region: region,
    credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
    },
    forcePathStyle: true,  // ✅ Neon S3 üçün VACİB
});

const MAX_ROWS = 1000;

function parseCsv(buf: Buffer) {
    return parse(buf, { columns: true, skip_empty_lines: true });
}
// XML-də ən dərin massivi tapır
function findFirstArray(obj: any, depth = 0): any[] | null {
    if (depth > 8 || !obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj) && obj.length > 0) return obj;
    for (const key of Object.keys(obj)) {
        const found = findFirstArray(obj[key], depth + 1);
        if (found && found.length > 0) return found;
    }
    return null;
}

// XML sütun adlarındaki _x0020_ və s.-ni təmizləyir
function cleanXmlKeys(rows: any[]): any[] {
    if (!Array.isArray(rows)) return rows;
    return rows.map((row) => {
        if (!row || typeof row !== 'object') return row;
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
            const cleanKey = k
                .replace(/_x0020_/g, ' ')
                .replace(/_x[\dA-Fa-f]{4}_/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            clean[cleanKey || k] = v;
        }
        return clean;
    });
}
function parseExcel(buf: Buffer) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length < 2) {
        return XLSX.utils.sheet_to_json(sheet);
    }

    // 1) Başlıq sətrini avtomatik tap
    // Şərt: ən az 2 dolu hücrə + növbəti sətirdə də eyni mövqelərdə data var
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i];
        const nonEmpty = row.filter(c => c !== '' && c !== null && c !== undefined).length;
        if (nonEmpty < 2) continue;
        const next = rows[i + 1];
        if (!next) continue;
        let matchCount = 0;
        for (let j = 0; j < row.length; j++) {
            if (row[j] !== '' && next[j] !== undefined && next[j] !== '') matchCount++;
        }
        if (matchCount >= Math.max(2, Math.floor(nonEmpty * 0.4))) {
            headerIdx = i;
            break;
        }
    }

    // 2) "EMPTY N" başlıqları varsa, bir sətir aşağı düş
    let headers: string[] = rows[headerIdx].map((h: any, i: number) => {
        const s = String(h).trim();
        return s || `Sütun ${i + 1}`;
    });

    const emptyCount = headers.filter(h => /^EMPTY\s*\d+$/i.test(h)).length;
    if (emptyCount > headers.length / 2 && rows[headerIdx + 1]) {
        headerIdx += 1;
        headers = rows[headerIdx].map((h: any, i: number) => {
            const s = String(h).trim();
            return s || `Sütun ${i + 1}`;
        });
    }

    // 3) Eyni adlı sütunları unikal et
    const seen: Record<string, number> = {};
    headers = headers.map(h => {
        if (seen[h] === undefined) { seen[h] = 0; return h; }
        seen[h]++;
        return `${h}_${seen[h]}`;
    });

    // 4) Data — başlıqdan sonraki bütün sətirlər
    const dataRows = rows.slice(headerIdx + 1).filter(r =>
        r.some(c => c !== '' && c !== null && c !== undefined)
    );

    return dataRows.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
        return obj;
    });
}

export class OpendataController {

    // Statistikalar
   static async getStats(req: Request, res: Response): Promise<void> {
    try {
        const [datasets, formats, orgs, topCategory, allDatasets] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS c FROM datasets'),
            pool.query('SELECT COUNT(DISTINCT format)::int AS c FROM datasets'),
            pool.query('SELECT COUNT(DISTINCT organization)::int AS c FROM datasets'),
            pool.query(`
                SELECT c.name, COUNT(d.id)::int AS count
                FROM categories c
                JOIN datasets d ON d.category_id = c.id
                GROUP BY c.name
                ORDER BY count DESC
                LIMIT 1
            `),
            // byGroup hesablaması üçün bütün dataset-ləri çəkirik
            pool.query(`
                SELECT d.group_name, c.path AS category_path
                FROM datasets d
                LEFT JOIN categories c ON d.category_id = c.id
            `),
        ]);

        // byGroup obyektini hesablayırıq
        const byGroup: Record<string, number> = {
            population: 0,
            labor: 0,
            education: 0,
            health: 0,
            crime: 0,
            economy: 0,
            environment: 0,
            geo: 0,
            map: 0,
            transport: 0,
            agriculture: 0,
            tourism: 0,
            culture: 0,
            energy: 0,
            sport: 0,
            trade: 0,
            industry: 0,
            other: 0,
        };

        for (const row of allDatasets.rows) {
            const group = row.group_name || OpendataController.guessGroup(row.category_path);
            byGroup[group] = (byGroup[group] || 0) + 1;
        }

        res.json({
            total_datasets: datasets.rows[0].c,
            total_formats: formats.rows[0].c,
            total_organizations: orgs.rows[0].c,
            top_category: topCategory.rows[0]?.name || '—',
            byGroup,   // ← ƏSAS: Frontend bunu gözləyir
        });
    } catch (error) {
        console.error('Stats xətası:', error);
        res.status(500).json({ error: 'Statistikalar çəkilə bilmədi' });
    }
}

    // Dataset siyahısı
static async getDatasets(req: Request, res: Response) {
    try {
        // 1. Əvvəl datanın ümumi sayını öyrən
        const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM datasets');
        const total = countRes.rows[0].total;

        // 2. rows parametri — default 5000, maksimum 50000
        const requested = parseInt(req.query.rows as string) || 5000;
        const rows = Math.min(requested, 50000);

        const result = await pool.query(`
            SELECT d.*, c.name AS category_name, c.path AS category_path
            FROM datasets d
            LEFT JOIN categories c ON d.category_id = c.id
            ORDER BY d.id DESC
            LIMIT $1
        `, [rows]);

        const formatted = result.rows.map((row) => ({
            id: row.id,
            resourceId: row.resource_id,
            title: row.title,
            slug: row.slug,
            organization: row.organization,
            metadataUrl: row.metadata_url,
            resourceName: row.resource_name,
            format: row.format,
            resourceUrl: row.original_url,
            storageUrl: row.storage_url,
            key: row.resource_id,
            group: row.group_name || OpendataController.guessGroup(row.category_path),
            categoryName: row.category_name,
            categoryPath: row.category_path,
        }));

        // ✅ Header-də ümumi sayı göndər (frontend istifadə edə bilər)
        res.setHeader('X-Total-Count', total.toString());
        res.json(formatted);
    } catch (error) {
        console.error('Datasets xətası:', error);
        res.status(500).json({ error: 'Datasetlər çəkilə bilmədi' });
    }
}
// Kateqoriya yolundan qrupu təxmin edən köməkçi funksiya
private static guessGroup(categoryPath: string | null): string {
    if (!categoryPath) return 'other';
    const path = categoryPath.toLowerCase();
    
    if (path.includes('əhali') || path.includes('demoqraf')) return 'population';
    if (path.includes('əmək') || path.includes('məşğul')) return 'labor';
    if (path.includes('iqtisad') || path.includes('büdcə') || path.includes('maliyy')) return 'economy';
    if (path.includes('təhsil') || path.includes('elm')) return 'education';
    if (path.includes('səhiyyə') || path.includes('tibb')) return 'health';
    if (path.includes('ərazil') || path.includes('coğraf') || path.includes('xəritə')) return 'geo';
    if (path.includes('nəqliyyat') || path.includes('metro')) return 'transport';
    if (path.includes('kənd') || path.includes('aqrar')) return 'agriculture';
    if (path.includes('turizm')) return 'tourism';
    if (path.includes('mədəniyyət')) return 'culture';
    if (path.includes('ekolog') || path.includes('təbii')) return 'environment';
    if (path.includes('enerji') || path.includes('elektrik')) return 'energy';
    if (path.includes('cinayət') || path.includes('hüquq')) return 'crime';
    if (path.includes('idman')) return 'sport';
    if (path.includes('ticarət') || path.includes('reklam')) return 'trade';
    if (path.includes('sənaye') || path.includes('tikinti')) return 'industry';
    
    return 'other';
}

    // Tək dataset-in məzmunu
    static async getContent(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) {
                res.status(400).json({ error: 'Yanlış ID' });
                return;
            }

            const dataset = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
            if (!dataset.rows[0]) {
                res.status(404).json({ error: 'Tapılmadı' });
                return;
            }

          const { storage_url, format, original_url, title, resource_name } = dataset.rows[0];

// ✅ FALLBACK: S3-də fayl yoxdursa, xarici URL-ə yönləndir
if (!storage_url && original_url) {
    console.log(`🔗 Xarici URL fetch edilir: ${original_url}`);
    const fmtUpper = String(format || '').toUpperCase();

    // JSON xarici faylları server tərəfdə çəkib qaytarırıq
    if (fmtUpper === 'JSON' || fmtUpper === 'GEOJSON') {
        try {
            const r = await fetch(original_url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const json = await r.json();
            if (json && typeof json === 'object' && !Array.isArray(json)) {
    const arrayField = Object.values(json).find((v) => Array.isArray(v));
    if (arrayField) {
        res.json(arrayField);
        return;
    }
}
            res.json(json);
            return;
        } catch (e) {
            console.error('Xarici JSON fetch xətası:', e);
            // alınmasa, aşağıdaki EXTERNAL blokuna düşür
        }
    }
    // XML xarici faylları server tərəfdə çəkib JSON-a çeviririk
    if (fmtUpper === 'XML') {
        try {
              const r = await fetch(original_url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const xml = await r.text();
            const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
            const json = parser.parse(xml);
            const arr = findFirstArray(json);
            res.json(cleanXmlKeys(arr || [json]));
            return;
        
        } catch (e) {
            console.error('Xarici XML fetch xətası:', e);
        }
    }
    // CSV xarici faylları server tərəfdə çəkib parse edirik
    if (fmtUpper === 'CSV') {
        try {
            const r = await fetch(original_url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const text = await r.text();
            const rows = parseCsv(Buffer.from(text, 'utf-8'));
            res.json(rows);
            return;
        } catch (e) {
            console.error('Xarici CSV fetch xətası:', e);
        }
    }
        // KMZ/KML → GeoJSON FeatureCollection
     // KMZ/KML → GeoJSON (regex ilə, böyük fayllar üçün)
    if (fmtUpper === 'KMZ' || fmtUpper === 'KML') {
        try {
            const r = await fetch(original_url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const buf = Buffer.from(await r.arrayBuffer());

            let kmlText: string;
            if (fmtUpper === 'KMZ') {
                const zip = new AdmZip(buf);
                const kmlEntry = zip.getEntries().find(e => e.entryName.toLowerCase().endsWith('.kml'));
                if (!kmlEntry) throw new Error('KMZ içində KML tapılmadı');
                kmlText = kmlEntry.getData().toString('utf-8');
            } else {
                kmlText = buf.toString('utf-8');
            }

            const features: any[] = [];

            // Hər <Placemark>...</Placemark> blokunu ayrıca tap
            const placemarkRe = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/g;
            let pmMatch: RegExpExecArray | null;

            while ((pmMatch = placemarkRe.exec(kmlText)) !== null) {
                const block = pmMatch[1];

                // name
                const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/);
                const name = nameMatch ? nameMatch[1].trim() : '—';

                // LineString koordinatları
                const lineMatch = block.match(/<LineString\b[^>]*>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/);
                if (lineMatch) {
                    const coords = lineMatch[1].trim().split(/\s+/)
                        .map(pair => {
                            const p = pair.split(',');
                            return [Number(p[0]), Number(p[1])];
                        })
                        .filter(c => !isNaN(c[0]) && !isNaN(c[1]));
                    if (coords.length > 1) {
                        features.push({
                            type: 'Feature',
                            properties: { name },
                            geometry: { type: 'LineString', coordinates: coords },
                        });
                    }
                    continue;
                }

                // Point koordinatları
                const pointMatch = block.match(/<Point\b[^>]*>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/);
                if (pointMatch) {
                    const p = pointMatch[1].trim().split(',');
                    const lon = Number(p[0]), lat = Number(p[1]);
                    if (!isNaN(lon) && !isNaN(lat)) {
                        features.push({
                            type: 'Feature',
                            properties: { name },
                            geometry: { type: 'Point', coordinates: [lon, lat] },
                        });
                    }
                    continue;
                }

                // Polygon koordinatları
                const polyMatch = block.match(/<Polygon\b[^>]*>[\s\S]*?<outerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/);
                if (polyMatch) {
                    const coords = polyMatch[1].trim().split(/\s+/)
                        .map(pair => {
                            const p = pair.split(',');
                            return [Number(p[0]), Number(p[1])];
                        })
                        .filter(c => !isNaN(c[0]) && !isNaN(c[1]));
                    if (coords.length > 2) {
                        features.push({
                            type: 'Feature',
                            properties: { name },
                            geometry: { type: 'Polygon', coordinates: [coords] },
                        });
                    }
                }
            }

            console.log(`✅ KMZ parse: ${features.length} feature tapıldı`);
            res.json({ type: 'FeatureCollection', features });
            return;
        } catch (e) {
            console.error('KMZ/KML fetch xətası:', e);
        }
    }
    // TXT xarici faylları server tərəfdə çəkib parse edirik
if (fmtUpper === 'TXT') {
    try {
        const r = await fetch(original_url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        const trimmed = text.trim();

        // Əvvəl JSON kimi yoxla (opendata.az tez-tez .txt içində JSON verir)
       try {
    const parsed = JSON.parse(trimmed);

    // Əgər obyekt tək açar altında array saxlayırsa (məs: { "Tibb Müəssisələri": [...] })
    // → array-i birbaşa qaytar
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const values = Object.values(parsed);
        const firstArray = values.find(v => Array.isArray(v));
        if (firstArray) {
            res.json(firstArray);
            return;
        }
    }

    res.json(parsed);
    return;
} catch {
            // JSON deyilsə → sətir-sətir obyekt kimi qaytar
            const lines = trimmed
                .split(/\r?\n/)
                .map((line, i) => ({ line: i + 1, value: line.trim() }))
                .filter(row => row.value !== '');
            res.json(lines);
            return;
        }
    } catch (e) {
        console.error('Xarici TXT fetch xətası:', e);
    }
}

    // JSON olmayan və ya fetch alınmayan hallar üçün xarici link
    res.json({
        type: 'EXTERNAL',
        url: original_url,
        format: format || 'EXTERNAL',
        title: resource_name || title,
    });
    return;
}

            const parts = String(storage_url).replace('s3://', '').split('/');
            const bucket = parts[0];
            const key = parts.slice(1).join('/');
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            const fmt = String(format).toUpperCase();

            // PDF: faylı yükləmədən birbaşa presigned URL qaytarırıq
            if (fmt === 'PDF') {
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                res.json({ type: 'PDF', url });
                return;
            }
            if (fmt === 'XLS' || fmt === 'XLSX') {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
                const size = head.ContentLength || 0;

                // 5 MB-dan böyükdürsə → presigned URL qaytar
                if (size > 5 * 1024 * 1024) {
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    res.json({ type: 'DOWNLOAD', url, format: fmt });
                    return;
                }

                // Kiçikdirsə → parse edib cədvəl kimi qaytar
                const response = await s3.send(command);
                if (!response.Body) {
                    res.status(404).json({ error: 'Fayl boşdur' });
                    return;
                }
                const buffer = Buffer.from(await response.Body.transformToByteArray());
                try {
                    const data = parseExcel(buffer);
                    res.json(data);
                } catch (parseErr) {
                    console.error('XLS parse xətası, presigned URL qaytarılır:', parseErr);
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    res.json({ type: 'DOWNLOAD', url, format: fmt });
                }
                return;
}

            const response = await s3.send(command);
            if (!response.Body) {
                res.status(404).json({ error: 'Fayl boşdur' });
                return;
            }
            const buffer = Buffer.from(await response.Body.transformToByteArray());

            switch (fmt) {
                case 'JSON':
                    res.json(JSON.parse(buffer.toString('utf-8')));
                    return;

                case 'CSV':
                    res.json(parseCsv(buffer));
                    return;
               case 'XML': {
                    const xmlText = buffer.toString('utf-8');
                    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
                    const parsed = parser.parse(xmlText);
                    const arr = findFirstArray(parsed);
                    res.json(cleanXmlKeys(arr || [parsed]));
                    return;
                }
                case 'XLS':
                case 'XLSX':
                    res.json(parseExcel(buffer));
                    return;

                case 'ZIP': {
                      const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Xüsusi hal: ZIP içində YALNIZ 1 fayl varsa və o PDF-dirsə
    // → onu S3-ə müvəqqəti yüklə və PDF kimi qaytar
    if (zipEntries.length === 1) {
        const entry = zipEntries[0];
        const entryExt = entry.entryName.split('.').pop()?.toUpperCase();
        if (entryExt === 'PDF') {
            const pdfBuffer = entry.getData();
            const tmpKey = `temp/zip-extract/${Date.now()}-${entry.entryName}`;

            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: tmpKey,
                Body: pdfBuffer,
                ContentType: 'application/pdf',
            }));

            const url = await getSignedUrl(
                s3,
                new GetObjectCommand({ Bucket: bucket, Key: tmpKey }),
                { expiresIn: 3600 }
            );

res.json({ type: 'PDF', url });
return;        }
    }

    // Çoxlu fayl → köhnə davranış (hər faylı ayrı emal et)
    const extractedData: any = {};
    zipEntries.forEach((entry) => {
        const entryExt = entry.entryName.split('.').pop()?.toUpperCase();
        const entryBuffer = entry.getData();

        if (entryExt === 'CSV') {
            extractedData[entry.entryName] = parse(entryBuffer, { columns: true, skip_empty_lines: true });
        } else if (entryExt === 'JSON') {
            extractedData[entry.entryName] = JSON.parse(entryBuffer.toString('utf-8'));
        } else if (['XLS', 'XLSX'].includes(entryExt || '')) {
            const wb = XLSX.read(entryBuffer, { type: 'buffer' });
            extractedData[entry.entryName] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        } else {
            extractedData[entry.entryName] = 'Binary fayl (oxunmadı)';
        }
    });
    return extractedData;
                }

                default:
                    res.status(400).json({ error: `Dəstəklənməyən format: ${fmt}` });
            }
        } catch (error) {
            console.error('Content xətası:', error);
            res.status(500).json({ error: 'Fayl emal edilə bilmədi' });
        }
    }
}