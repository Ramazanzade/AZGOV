// server/scripts/recover-external-urls.js
const fs = require('fs');
const { Client } = require('pg');

const pg = new Client({ connectionString: process.env.DATABASE_URL });

async function recoverUrls() {
    await pg.connect();
    
    // Orijinal JSON-u oxu
const path = require('path');
const rawData = fs.readFileSync(path.join(__dirname, '../config/datasets.json'), 'utf-8');
    const datasets = JSON.parse(rawData);
    
    console.log(`📦 JSON-da ${datasets.length} dataset var`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const item of datasets) {
        // Yalnız xarici URL-i olanları yenilə
        if (!item.resourceUrl) continue;
        
        // resource_id ilə DB-də axtar
        const result = await pg.query(
            `UPDATE datasets 
             SET original_url = $1, updated_at = NOW()
             WHERE resource_id = $2 
             AND (original_url IS NULL OR original_url = '')
             RETURNING id, title`,
            [item.resourceUrl, item.resourceId]
        );
        
        if (result.rowCount > 0) {
            updated++;
            console.log(`✅ Yeniləndi: ${result.rows[0].title}`);
        } else {
            notFound++;
        }
    }
    
    console.log(`\n📊 Nəticə:`);
    console.log(`   ✅ Yenilənən: ${updated}`);
    console.log(`   ⏭️  Artıq mövcud: ${notFound}`);
    
    await pg.end();
}

recoverUrls().catch(console.error);