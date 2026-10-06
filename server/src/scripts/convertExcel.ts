import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface DatasetRecord {
  title: string;
  slug: string;
  organization: string;
  metadataUrl: string;
  resourceName: string;
  format: string;
  resourceUrl: string;
  resourceId: string;
  // Törəmə sahələr
  key: string;         // slug-dan təmizlənmiş unikal açar
  group: string;       // kateqoriya təxmini
}

// Excel faylının yolu
const EXCEL_PATH = path.resolve(__dirname, '../../../opendata_full_with_apis.xlsx');
const OUTPUT_PATH = path.resolve(__dirname, '../config/datasets.json');

// Slug-dan key yaradırıq
const slugToKey = (slug: string): string => {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};

// Başlıqdan kateqoriya təyin edirik (basit heuristic)
const inferGroup = (title: string, organization: string): string => {
  const t = (title + ' ' + organization).toLowerCase();
  if (t.includes('metropoliten') || t.includes('metro')) return 'metro';
  if (t.includes('bus') || t.includes('avtobus') || t.includes('nəqliyyat')) return 'transport';
  if (t.includes('turizm') || t.includes('hotel') || t.includes('mehmanxana')) return 'tourism';
  if (t.includes('təhsil') || t.includes('məktəb') || t.includes('universitet')) return 'education';
  if (t.includes('səhiyyə') || t.includes('tibb') || t.includes('xəstə')) return 'health';
  if (t.includes('əhali') || t.includes('demoqraf') || t.includes('doğum') || t.includes('ölüm')) return 'population';
  if (t.includes('əmək') || t.includes('məşğul') || t.includes('işsiz') || t.includes('əməkhaqqı')) return 'labor';
  if (t.includes('iqtisad') || t.includes('büdcə') || t.includes('vergi') || t.includes('maliyyə')) return 'economy';
  if (t.includes('sənaye') || t.includes('istehsal') || t.includes('tikinti')) return 'industry';
  if (t.includes('kənd') || t.includes('əkin') || t.includes('heyvandar')) return 'agriculture';
  if (t.includes('enerji') || t.includes('elektrik') || t.includes('qaz')) return 'energy';
  if (t.includes('ticarət') || t.includes('iaşə') || t.includes('pərakəndə')) return 'trade';
  if (t.includes('ətrafl') || t.includes('ekolog') || t.includes('tullantı') || t.includes('su ')) return 'environment';
  if (t.includes('cinayət') || t.includes('hüquq') || t.includes('məhkəmə')) return 'crime';
  if (t.includes('idman') || t.includes('stadion') || t.includes('olimpiya')) return 'sport';
  if (t.includes('mədəniyyət') || t.includes('muzey') || t.includes('teatr')) return 'culture';
  if (t.includes('geojson') || t.includes('xəritə') || t.includes('koordinat') || t.includes('rayon')) return 'geo';
  if (t.includes('rayon') || t.includes('icra hakimiyyəti')) return 'regional';
  return 'other';
};

const convert = () => {
  console.log('📖 Excel oxunur:', EXCEL_PATH);

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Excel-i JSON-a çevir (ilk sətir başlıq)
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`📊 ${rows.length} sətir tapıldı`);

  const seen = new Set<string>();
  const datasets: DatasetRecord[] = [];

  for (const row of rows) {
    const title = String(row['Dataset Title'] || '').trim();
    const slug = String(row['Dataset Name (slug)'] || '').trim();
    const organization = String(row['Organization'] || '').trim();
    const metadataUrl = String(row['Package API (metadata)'] || '').trim();
    const resourceName = String(row['Resource Name'] || '').trim();
    const format = String(row['Format'] || '').trim().toUpperCase();
    const resourceUrl = String(row['Resource Download URL'] || '').trim();
    const resourceId = String(row['Resource ID'] || '').trim();

    // Metadata URL yoxdursa, keç
    if (!metadataUrl || !slug) continue;

    // Eyni slug birdən çox sətirdə ola bilər (CSV + JSON variantları).
    // Açar yaradırıq: slug + format + resourceId
    const key = `${slugToKey(slug)}_${format.toLowerCase()}_${resourceId.slice(0, 8)}`;

    if (seen.has(key)) continue;
    seen.add(key);

    datasets.push({
      title,
      slug,
      organization,
      metadataUrl,
      resourceName,
      format,
      resourceUrl,
      resourceId,
      key,
      group: inferGroup(title, organization)
    });
  }

  console.log(`✅ ${datasets.length} unikal dataset hazırlandı`);

  // JSON kimi yaz
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(datasets, null, 2), 'utf-8');
  console.log(`💾 Yazıldı: ${OUTPUT_PATH}`);

  // Statistika
  const byGroup: Record<string, number> = {};
  const byFormat: Record<string, number> = {};
  datasets.forEach(d => {
    byGroup[d.group] = (byGroup[d.group] || 0) + 1;
    byFormat[d.format] = (byFormat[d.format] || 0) + 1;
  });

  console.log('\n📈 Qruplara görə:');
  Object.entries(byGroup)
    .sort((a, b) => b[1] - a[1])
    .forEach(([g, c]) => console.log(`  ${g}: ${c}`));

  console.log('\n📁 Formatlara görə:');
  Object.entries(byFormat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([f, c]) => console.log(`  ${f}: ${c}`));
};

convert();