import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';   // ✅ ƏLAVƏ ET

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
// PNG export (chart element) — html-to-image ilə (Recharts SVG dəstəyi)
export const exportPNG = async (element: HTMLElement, filename = 'chart.png') => {
  if (!element) return;

  // Aktiv temanın rənglərini götür
  const styles = getComputedStyle(document.documentElement);
  const bg = styles.getPropertyValue('--bg-primary').trim() || '#0a0e1a';
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#e5e7eb';

  const rect = element.getBoundingClientRect();
const cssVarNames = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-card',
  '--bg-hover',
  '--border',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--accent-cyan',
  '--accent-purple',
  '--accent-pink',
  '--accent-blue',
] as const;

const fallbacks: Record<(typeof cssVarNames)[number], string> = {
  '--bg-primary': '#0a0e1a',
  '--bg-secondary': '#111827',
  '--bg-card': '#1a1f35',
  '--bg-hover': '#232942',
  '--border': '#2a3050',
  '--text-primary': '#e5e7eb',
  '--text-secondary': '#9ca3af',
  '--text-muted': '#6b7280',
  '--accent-cyan': '#22d3ee',
  '--accent-purple': '#a855f7',
  '--accent-pink': '#ec4899',
  '--accent-blue': '#3b82f6',
};
const cssVars = Object.fromEntries(
  cssVarNames.map((name) => [
    name,
    styles.getPropertyValue(name).trim() || fallbacks[name],
  ])
);
  const dataUrl = await toPng(element, {
  backgroundColor: bg,
  width: rect.width || 800,
  height: rect.height || 400,
  pixelRatio: 2,
  cacheBust: true,
  style: {
    ...cssVars,
    background: bg,
    color: textColor,
  } as Partial<CSSStyleDeclaration>,
  filter: (node) => {
    if (node instanceof HTMLElement) {
      if (node.classList?.contains('recharts-tooltip-wrapper')) return false;
    }
    return true;
  },
});

  // Yüklə
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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


// Bütün chart-ları PNG kimi yüklə (hər biri ayrı fayl)
export const exportAllCharts = async (baseTitle: string) => {
  const charts = document.querySelectorAll('[data-export-chart]');
  if (charts.length === 0) {
    alert('Chart tapılmadı');
    return;
  }

  const styles = getComputedStyle(document.documentElement);
  const bg = styles.getPropertyValue('--bg-primary').trim() || '#0a0e1a';
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#e5e7eb';

  const inlineVars = {
    '--bg-primary':   bg,
    '--bg-secondary': styles.getPropertyValue('--bg-secondary').trim() || '#111827',
    '--bg-card':      styles.getPropertyValue('--bg-card').trim() || '#1a1f35',
    '--bg-hover':     styles.getPropertyValue('--bg-hover').trim() || '#232942',
    '--border':       styles.getPropertyValue('--border').trim() || '#2a3050',
    '--text-primary': textColor,
    '--text-secondary': styles.getPropertyValue('--text-secondary').trim() || '#9ca3af',
    '--text-muted':   styles.getPropertyValue('--text-muted').trim() || '#6b7280',
    '--accent-cyan':  styles.getPropertyValue('--accent-cyan').trim() || '#22d3ee',
    '--accent-purple': styles.getPropertyValue('--accent-purple').trim() || '#a855f7',
    '--accent-pink':  styles.getPropertyValue('--accent-pink').trim() || '#ec4899',
    '--accent-blue':  styles.getPropertyValue('--accent-blue').trim() || '#3b82f6',
  };

  for (let i = 0; i < charts.length; i++) {
    const el = charts[i] as HTMLElement;
    const chartTitle = el.getAttribute('data-export-title') || `chart-${i + 1}`;
    const filename = buildFilename(`${baseTitle}-${chartTitle}`, 'png');

    try {
      const rect = el.getBoundingClientRect();
      const dataUrl = await toPng(el, {
        backgroundColor: bg,
        width: Math.max(rect.width, 800),
        height: Math.max(rect.height, 400),
        pixelRatio: 2,
        cacheBust: true,
        style: {
          ...inlineVars,
          background: bg,
          color: textColor,
          padding: '20px',
          borderRadius: '12px',
        },
        filter: (node) => {
          if (node instanceof HTMLElement) {
            // Tooltip-ləri çıxar
            if (node.classList?.contains('recharts-tooltip-wrapper')) return false;
            // Export düymələrini çıxar (əgər chart içindədirsə)
            if (node.hasAttribute?.('data-export-ignore')) return false;
          }
          return true;
        },
      });

      // Yüklə
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Brauzer ardıcıl yükləmələri bloklamasın deyə kiçik fasilə
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Chart "${chartTitle}" export xətası:`, err);
    }
  }
};