import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg'; // Əgər @neondatabase/serverless istifadə edirsinizsə, onu uyğunlaşdırın
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import AdmZip from 'adm-zip';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Neon S3 Konfiqurasiyası
const s3 = new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.NEON_STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.NEON_STORAGE_SECRET_KEY!,
    },
});

export class OpendataService {
    
    // 1. Bütün dataset-ləri DB-dən çəkmək
    static async getAllDatasets() {
        const result = await pool.query(`
            SELECT d.*, c.name as category_name, c.path as category_path 
            FROM datasets d
            LEFT JOIN categories c ON d.category_id = c.id
            ORDER BY d.id
        `);
        return result.rows;
    }

    // 2. ID-yə görə dataset tapmaq
    static async getDatasetById(id: number) {
        const result = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
        return result.rows[0];
    }

    // 3. Storage-dan faylı endirib emal etmək (Əsas məntiq)
    static async getDatasetContent(id: number) {
        const dataset = await this.getDatasetById(id);
        if (!dataset || !dataset.storage_url) {
            throw new Error('Dataset tapılmadı və ya fayl yoxdur');
        }

        // S3 URL-ni hissələrə ayırırıq: s3://bucket-name/key
        const urlParts = dataset.storage_url.replace('s3://', '').split('/');
        const bucket = urlParts[0];
        const key = urlParts.slice(1).join('/');

        // S3-dən faylı Buffer kimi endiririk
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await s3.send(command);
        
        if (!response.Body) throw new Error('Fayl boşdur');
        const buffer = Buffer.from(await response.Body.transformToByteArray());

        const format = dataset.format.toUpperCase();

        // Formatına görə emal edirik
        switch (format) {
            case 'JSON':
                return JSON.parse(buffer.toString('utf-8'));

            case 'CSV':
                return parse(buffer, { columns: true, skip_empty_lines: true });

            case 'XLS':
            case 'XLSX':
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                return XLSX.utils.sheet_to_json(worksheet);

            case 'ZIP':
                // ZIP faylını açırıq
                const zip = new AdmZip(buffer);
                const zipEntries = zip.getEntries();
                const extractedData: any = {};
                
                // ZIP içindəki hər bir faylı oxuyuruq
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
                        // Digər fayllar üçün sadəcə adını qeyd edirik
                        extractedData[entry.entryName] = 'Binary fayl (oxunmadı)';
                    }
                });
                return extractedData;

            case 'PDF':
                // PDF-i backend-də oxumaq mənasızdır, frontend üçün presigned URL yaradırıq
                const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
                const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
                return { type: 'PDF', url: signedUrl };

            default:
                throw new Error(`Dəstəklənməyən format: ${format}`);
        }
    }
}