import { niceName } from './columnLabels';

const COLORS = [
  '#22d3ee', // cyan
  '#a855f7', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#eab308'  // yellow
];

export interface MultiSeriesResult {
  data: any[];           // [{ period: '2018', 'Qida məhsulları': 190, 'Xidmətlər': 100 }, ...]
  series: { key: string; color: string }[];
  periodKey: string;
  valueKey: string;
}

/**
 * Multi-series data hazırlayır.
 * @param rows Xam data
 * @param periodKey Tarix/dövr sütunu (TIME_PERIOD)
 * @param seriesKey Hər xətti ayıran sütun (INDICATOR)
 * @param valueKey Rəqəmsal dəyər sütunu (OBS_VALUE)
 */
export const buildMultiSeries = (
  rows: any[],
  periodKey: string,
  seriesKey: string,
  valueKey: string
): MultiSeriesResult | null => {
  if (!periodKey || !seriesKey || !valueKey) return null;

  // 1. Bütün unikal dövrləri topla
  const periodsSet = new Set<string>();
  rows.forEach(r => {
    const p = String(r[periodKey] ?? '').trim();
    if (p) periodsSet.add(p);
  });
  const periods = Array.from(periodsSet).sort((a, b) => a.localeCompare(b));
  if (periods.length < 2) return null;

  // 2. Bütün unikal seriyaları topla (top 8-ə limit)
  const seriesCount = new Map<string, number>();
  rows.forEach(r => {
    const s = String(r[seriesKey] ?? '').trim();
    if (!s) return;
    seriesCount.set(s, (seriesCount.get(s) || 0) + 1);
  });
  const allSeries = Array.from(seriesCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name], i) => ({ key: name, color: COLORS[i % COLORS.length] }));

  if (allSeries.length === 0) return null;

  // 3. Period × Series matrisi qur (cəm ilə)
  const map = new Map<string, Map<string, number>>();
  rows.forEach(r => {
    const p = String(r[periodKey] ?? '').trim();
    const s = String(r[seriesKey] ?? '').trim();
    if (!p || !s) return;
    const v = Number(String(r[valueKey] ?? '').replace(/[^\d.-]/g, '')) || 0;
    if (!map.has(p)) map.set(p, new Map());
    const inner = map.get(p)!;
    inner.set(s, (inner.get(s) || 0) + v);
  });

  // 4. Chart üçün array qur
  const data = periods.map(p => {
    const row: any = { period: p };
    allSeries.forEach(s => {
      row[s.key] = map.get(p)?.get(s.key) ?? null;
    });
    return row;
  });

  return { data, series: allSeries, periodKey, valueKey };
};