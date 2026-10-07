import html2canvas from 'html2canvas';

// CSV export
export const exportCSV = (data: any[], filename = 'data.csv') => {
  if (!Array.isArray(data) || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const escape = (v: any) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.map(escape).join(','),
    ...data.map(row => headers.map(h => escape(row[h])).join(','))
  ];

  // UTF-8 BOM əlavə et (Excel Azərbaycan hərflərini tanısın)
  const csv = '\uFEFF' + lines.join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
};

// JSON export
export const exportJSON = (data: any, filename = 'data.json') => {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(new Blob([json], { type: 'application/json;charset=utf-8;' }), filename);
};

// PNG export (chart element)
export const exportPNG = async (element: HTMLElement, filename = 'chart.png') => {
  if (!element) return;
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0e1a',
    scale: 2,
    logging: false
  });
  canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, filename);
  }, 'image/png');
};

// Ortak: Blob-u yüklə
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Fayl adı yarat (təmiz)
export const buildFilename = (title: string, ext: string) => {
  const clean = title
    .toLowerCase()
    .replace(/[əğıöüşçİ]/g, c => ({ ə: 'e', ğ: 'g', ı: 'i', ö: 'o', ü: 'u', ş: 's', ç: 'c', İ: 'i' }[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${clean}.${ext}`;
};