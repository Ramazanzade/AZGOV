// Müxtəlif lat/lon sütun adları
const LAT_KEYS = ['lat', 'latitude', 'enlem', 'y', 'koordinat_y', 'Lat', 'Latitude', 'LAT', 'Y'];
const LON_KEYS = ['lon', 'lng', 'long', 'longitude', 'uzunluq', 'x', 'koordinat_x', 'Lon', 'Lng', 'Longitude', 'LON', 'LNG', 'X'];

// Ad üçün namizəd sütunlar (marker popup-da göstərmək üçün)
const NAME_KEYS = ['name', 'ad', 'title', 'Ad', 'Name', 'NAME', 'adı', 'obyekt', 'stansiya', 'Stansiya'];

const findKey = (sample: any, candidates: string[]): string | null => {
  const keys = Object.keys(sample);
  for (const cand of candidates) {
    const found = keys.find(k => k.toLowerCase() === cand.toLowerCase());
    if (found) return found;
  }
  // Qismən uyğunluq (məs: "station_lat")
  for (const cand of candidates) {
    const found = keys.find(k => k.toLowerCase().includes(cand.toLowerCase()));
    if (found) return found;
  }
  return null;
};

const parseNum = (v: any): number | null => {
  const cleaned = String(v ?? '').trim().replace(',', '.');
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
};

export interface GeoPoint {
  lat: number;
  lon: number;
  name: string;
  raw: any;
}

export interface GeoDetection {
  latKey: string;
  lonKey: string;
  nameKey: string | null;
  points: GeoPoint[];
  // Bütün marker-lərin centroid-u (xəritə mərkəzi üçün)
  center: [number, number];
}

/**
 * Dataset-də lat/lon sütunları varsa, xəritə üçün nöqtələri hazırlayır.
 */
export const detectGeoPoints = (rows: any[]): GeoDetection | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const sample = rows[0];
  const latKey = findKey(sample, LAT_KEYS);
  const lonKey = findKey(sample, LON_KEYS);

  if (!latKey || !lonKey) return null;

  const nameKey = findKey(sample, NAME_KEYS);

  const points: GeoPoint[] = [];
  for (const row of rows.slice(0, 2000)) {
    const lat = parseNum(row[latKey]);
    const lon = parseNum(row[lonKey]);

    // Azərbaycan koordinat aralığı (təxmini)
    if (lat === null || lon === null) continue;
    if (lat < 38 || lat > 42.5) continue;
    if (lon < 44.5 || lon > 51) continue;

    points.push({
      lat,
      lon,
      name: nameKey ? String(row[nameKey] ?? '').trim() : `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      raw: row
    });
  }

  if (points.length === 0) return null;

  // Centroid
  const center: [number, number] = [
    points.reduce((s, p) => s + p.lat, 0) / points.length,
    points.reduce((s, p) => s + p.lon, 0) / points.length
  ];

  return { latKey, lonKey, nameKey, points, center };
};