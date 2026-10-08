import dotenv from 'dotenv';
dotenv.config();   // ← ƏN YUXARIDA, import-lardan ƏVVƏL

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('❌ DATABASE_URL .env faylında tapılmadı');
}

// Debug: URL-in düzgün oxunduğunu yoxla
console.log('🔗 DB URL:', url.slice(0, 40) + '...');

const sql = neon(url);
export const db = drizzle(sql, { schema });