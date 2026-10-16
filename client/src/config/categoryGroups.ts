export interface SuperGroup {
  id: string;
  label: string;
  icon?: string;
  rootNames: string[]; // DB-dəki slug-lar
}

export const SUPER_GROUPS: SuperGroup[] = [
  {
    id: 'demographic',
    label: 'Demoqrafik və sosial',
    icon: 'users',
    rootNames: ['population', 'labor', 'education', 'health', 'culture'],
  },
  {
    id: 'industry',
    label: 'Sənaye və energetika',
    icon: 'factory',
    rootNames: ['industry'],
  },
  {
    id: 'agriculture',
    label: 'Kənd təsərrüfatı',
    icon: 'wheat',
    rootNames: ['agriculture'],
  },
  {
    id: 'transport',
    label: 'Nəqliyyat və rabitə',
    icon: 'truck',
    rootNames: ['transport'],
  },
  {
    id: 'digital',
    label: 'Rəqəmsal inkişaf',
    icon: 'cpu',
    rootNames: ['digital'],
  },
  {
    id: 'geo',
    label: 'Coğrafi məlumatlar',
    icon: 'map',
    rootNames: ['geo'],
  },
  {
    id: 'other',
    label: 'Digər',
    icon: 'database',
    rootNames: ['other'],
  },
];