import 'dotenv/config';  // ← ƏN İLK SƏTİR
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const accessKey = process.env.NEON_STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.NEON_STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION || 'us-east-1';

console.log('🔑 S3 Config yoxlanılır:');
console.log('   endpoint:', endpoint ? '✓' : '✗');
console.log('   accessKey:', accessKey ? `✓ (${accessKey.substring(0, 12)}...)` : '✗');
console.log('   secretKey:', secretKey ? `✓ (${secretKey.substring(0, 12)}...)` : '✗');
console.log('   region:', region);

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
    forcePathStyle: true,
});

function parseCsv(buf: Buffer) {
    return parse(buf, { columns: true, skip_empty_lines: true });
}

function parseExcel(buf: Buffer) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

export class OpendataController {

    // ─────────── Statistikalar ───────────
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
                pool.query(`
                    SELECT d.group_name, c.path AS category_path
                    FROM datasets d
                    LEFT JOIN categories c ON d.category_id = c.id
                `),
            ]);

            const byGroup: Record<string, number> = {
                population: 0, labor: 0, education: 0, health: 0, crime: 0,
                economy: 0, environment: 0, geo: 0, map: 0, transport: 0,
                agriculture: 0, tourism: 0, culture: 0, energy: 0, sport: 0,
                trade: 0, industry: 0, other: 0,
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
                byGroup,
            });
        } catch (error) {
            console.error('Stats xətası:', error);
            res.status(500).json({ error: 'Statistikalar çəkilə bilmədi' });
        }
    }

    // ─────────── Dataset siyahısı ───────────
    static async getDatasets(req: Request, res: Response): Promise<void> {
        try {
            const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM datasets');
            const total = countRes.rows[0].total;

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

            res.setHeader('X-Total-Count', total.toString());
            res.json(formatted);
        } catch (error) {
            console.error('Datasets xətası:', error);
            res.status(500).json({ error: 'Datasetlər çəkilə bilmədi' });
        }
    }

    // ─────────── Kateqoriyadan qrup təxmini ───────────
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

    // ─────────── Tək dataset məzmunu ───────────
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

            // ✅ EXTERNAL: S3-də yoxdur, amma xarici URL var
            if (!storage_url && original_url) {
                console.log(`🔗 EXTERNAL: ${title} → ${original_url}`);
                res.json({
                    type: 'EXTERNAL',
                    url: original_url,
                    format: format || 'LINK',
                    title: resource_name || title || 'Xarici fayl',
                    message: 'Bu fayl xarici mənbədə yerləşir',
                });
                return;
            }

            // Hər ikisi yoxdursa → xəta
            if (!storage_url) {
                res.status(404).json({
                    error: 'Fayl mövcud deyil',
                    detail: 'Bu dataset üçün nə S3-də, nə də xarici mənbədə fayl tapılmadı',
                });
                return;
            }

            // S3-dən oxu
            const parts = String(storage_url).replace('s3://', '').split('/');
            const bucketName = parts[0];
            const key = parts.slice(1).join('/');
            const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
            const fmt = String(format).toUpperCase();

            // PDF → presigned URL
            if (fmt === 'PDF') {
                try {
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    res.json({ type: 'PDF', url });
                    return;
                } catch (s3Err) {
                    console.error('❌ S3 presigned xətası:', s3Err);
                    // PDF presigned xətası olsa, EXTERNAL fallback
                    if (original_url) {
                        res.json({
                            type: 'EXTERNAL',
                            url: original_url,
                            format: 'PDF',
                            title: resource_name || title,
                        });
                        return;
                    }
                    res.status(500).json({ error: 'PDF linki yaradıla bilmədi' });
                    return;
                }
            }

            // Digər formatlar üçün faylı endir
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

                case 'XLS':
                case 'XLSX':
                    res.json(parseExcel(buffer));
                    return;

                case 'ZIP': {
                    const zip = new AdmZip(buffer);
                    const out: Record<string, unknown> = {};

                    for (const entry of zip.getEntries()) {
                        if (entry.isDirectory) continue;
                        const ext = entry.entryName.split('.').pop()?.toUpperCase();
                        const entryData = entry.getData();

                        if (ext === 'CSV') out[entry.entryName] = parseCsv(entryData);
                        else if (ext === 'JSON') out[entry.entryName] = JSON.parse(entryData.toString('utf-8'));
                        else if (ext === 'XLS' || ext === 'XLSX') out[entry.entryName] = parseExcel(entryData);
                        else out[entry.entryName] = 'Binary fayl (oxunmadı)';
                    }
                    res.json(out);
                    return;
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