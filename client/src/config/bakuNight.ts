export interface BakuNightCard {
  id: string;
  title: string;
  subtitle: string;
  valueKey?: string;  // hansı sütundan rəqəm götürülsün
  labelKey?: string;
  color: 'cyan' | 'purple' | 'pink' | 'blue';
  metadataUrl: string;
}

export const BAKU_NIGHT_STATS: BakuNightCard[] = [
  {
    id: 'metro',
    title: 'Metro Sərnişin',
    subtitle: 'Gündəlik giriş',
    valueKey: 'Giriş',
    labelKey: 'Stansiya',
    color: 'cyan',
    metadataUrl: 'https://admin.datahub.az/api/3/action/package_show?id=stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi'
  },
  {
    id: 'metro-payment',
    title: 'Turniket Keçidləri',
    subtitle: 'Ödəniş növləri üzrə',
    valueKey: 'Say',
    labelKey: 'Ödəniş növü',
    color: 'purple',
    metadataUrl: 'https://admin.datahub.az/api/3/action/package_show?id=baki-metro-stansiyalarinda-gundelik-turniket-kecidlerinin-odenis-novleri-uzre-bolgusu'
  },
  {
    id: 'economy',
    title: 'İqtisadi göstəricilər',
    subtitle: 'Sahələr üzrə',
    valueKey: 'Manat',
    labelKey: 'Sahə',
    color: 'pink',
    metadataUrl: 'https://admin.datahub.az/api/3/action/package_show?id=i-qtisadiyyatin-saheleri-uzre-orta-ayliq-nominal-emekhaqqi-manat'
  }
];

export const BAKU_NIGHT_MAP = {
  metadataUrl: 'https://admin.datahub.az/api/3/action/package_show?id=metro-cixislari-uzre-koordinatlar'
};

export const BAKU_NIGHT_CHARTS = {
  line: 'https://admin.datahub.az/api/3/action/package_show?id=stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi',
  pie: 'https://admin.datahub.az/api/3/action/package_show?id=baki-metro-stansiyalarinda-gundelik-turniket-kecidlerinin-odenis-novleri-uzre-bolgusu',
  bar: 'https://admin.datahub.az/api/3/action/package_show?id=i-qtisadiyyatin-saheleri-uzre-orta-ayliq-nominal-emekhaqqi-manat'
};