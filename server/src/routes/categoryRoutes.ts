import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';

const router = Router();

// GET /api/categories
// DB-dəki categories cədvəlini olduğu kimi qaytarır (hələlik flat list)
router.get('/', async (_req, res) => {
  try {
    const result: any = await db.execute(sql`
      SELECT id, name, parent_id, path
      FROM categories
      ORDER BY id ASC
    `);

    // Drizzle bəzən { rows: [...] } qaytarır, bəzən birbaşa array
    const rows = result?.rows ?? result ?? [];

    res.json({ success: true, count: rows.length, data: rows });
  } catch (e: any) {
    console.error('❌ Kategoriya endpoint xətası:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});
// GET /api/categories/tree  →  nested tree (children array-li)
router.get('/tree', async (_req, res) => {
  try {
    const result: any = await db.execute(sql`
      SELECT id, name, parent_id, path
      FROM categories
      ORDER BY id ASC
    `);
    const rows: any[] = result?.rows ?? result ?? [];

    // Flat → nested tree
    const map = new Map<number, any>();
    rows.forEach(r => {
      map.set(r.id, { id: r.id, name: r.name, parent_id: r.parent_id, path: r.path, children: [] });
    });

    const roots: any[] = [];
    rows.forEach(r => {
      const node = map.get(r.id);
      if (r.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(r.parent_id);
        if (parent) parent.children.push(node);
      }
    });

    res.json({ success: true, count: roots.length, data: roots });
  } catch (e: any) {
    console.error('❌ Tree endpoint xətası:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});
export default router;