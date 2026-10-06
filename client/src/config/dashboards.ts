import { Sparkles, LucideIcon } from 'lucide-react';

export interface StatCardConfig {
  id: string;
  title: string;
  subtitle: string;
  valueKey?: string;
  color: 'cyan' | 'purple' | 'pink' | 'blue';
  metadataUrl: string;
  aggregation?: 'sum' | 'avg' | 'count';
}

export interface ChartConfig {
  id: string;
  title: string;
  metadataUrl: string;
  span?: 1 | 2;
  defaultView?: 'chart' | 'table';
}

export interface DashboardConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  statCards: StatCardConfig[];
  charts: ChartConfig[];
  map?: { title: string; metadataUrl: string };
}

// ---------- BAKU NIGHT (yalnız bu qalır) ----------
export const BAKU_NIGHT: DashboardConfig = {
  id: 'baku-night',
  title: 'Baku Night',
  subtitle: 'Real vaxt məlumatları və açıq statistika',
  icon: Sparkles,
  iconColor: 'text-accent-pink',
  statCards: [
    {
      id: 'metro',
      title: 'Metro Sərnişin',
      subtitle: 'Gündəlik giriş',
      valueKey: 'Giriş',
      color: 'cyan',
      metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi'
    },
    {
      id: 'metro-payment',
      title: 'Turniket Keçidləri',
      subtitle: 'Ödəniş növləri üzrə',
      valueKey: 'Say',
      color: 'purple',
      metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=baki-metro-stansiyalarinda-gundelik-turniket-kecidlerinin-odenis-novleri-uzre-bolgusu'
    },
    {
      id: 'economy',
      title: 'İqtisadi göstəricilər',
      subtitle: 'Sahələr üzrə',
      valueKey: 'Manat',
      color: 'pink',
      metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=i-qtisadiyyatin-saheleri-uzre-orta-ayliq-nominal-emekhaqqi-manat'
    },
    {
      id: 'stats',
      title: 'Statistika',
      subtitle: 'Ümumi dataset',
      color: 'blue',
      metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=esas-fondlarin-istifadəyə-verilməsi'
    }
  ],
  charts: [
    {
      id: 'dynamics',
      title: 'Dinamika',
      metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi',
      span: 2,
      defaultView: 'chart'
    },
    {
      id: 'share',
      title: 'Sərnişin payı',
      metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=baki-metro-stansiyalarinda-gundelik-turniket-kecidlerinin-odenis-novleri-uzre-bolgusu',
      defaultView: 'chart'
    }
  ],
  map: {
    title: 'Bakı Metropoliteni xəritəsi',
    metadataUrl: 'https://admin.opendata.az/api/3/action/package_show?id=metro-cixislari-uzre-koordinatlar'
  }
};

// Yalnız BakuNight qeydiyyatda
export const DASHBOARDS: Record<string, DashboardConfig> = {
  'baku-night': BAKU_NIGHT
};