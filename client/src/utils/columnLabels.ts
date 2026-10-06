// Sütun adlarını Azərbaycan dilinə çevirən lüğət
export const COLUMN_LABELS: Record<string, string> = {
  // Ümumi CKAN statistik sütunları
  TIME_PERIOD: 'Dövr',
  DATASET_TITLE: 'Dataset',
  INDICATOR: 'Göstərici',
  UNIT_MEASURE: 'Ölçü vahidi',
  OBS_VALUE: 'Dəyər',

  // Tarix
  DATE: 'Tarix',
  YEAR: 'İl',
  MONTH: 'Ay',
  DAY: 'Gün',

  // Coğrafi
  CITY: 'Şəhər',
  CITY_AZ: 'Şəhər',
  STATE: 'Rayon',
  STATE_AZ: 'Rayon',
  COUNTRY: 'Ölkə',
  COUNTRY_AZ: 'Ölkə',
  STRT_NAME: 'Küçə',
  STRT_N_AZ: 'Küçə',
  STRT_ADDR: 'Ünvan',
  NEW_ADDR: 'Yeni ünvan',
  NAME: 'Ad',
  NAME_AZ: 'Ad',
  TYPE: 'Tip',
  status: 'Status',
  Code_OSM: 'OSM kodu',

  // Metro / Nəqliyyat
  Stansiya: 'Stansiya',
  Giriş: 'Giriş',
  Say: 'Say',
  Marşrut: 'Marşrut',
  Sərnişin: 'Sərnişin',
  Ödəniş_növü: 'Ödəniş növü',
  Ödəniş_novu: 'Ödəniş növü',

  // İqtisadiyyat
  Manat: 'Məbləğ (manat)',
  Sahə: 'Sahə',
  İl: 'İl',
  Rüb: 'Rüb',
  Region: 'Region',
};

// Gözəl ad qaytarır; tapılmasa, orijinalı qaytarır (alt xətti boşluqla əvəz edir)
export const niceName = (key?: string): string => {
  if (!key) return '';
  if (COLUMN_LABELS[key]) return COLUMN_LABELS[key];
  // alt xətləri boşluqla əvəz et, ilk hərfi böyük et
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};