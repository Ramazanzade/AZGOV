import {
  Home,
  Users,
  TrendingUp,
  Leaf,
  Map,
  Code2,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  path?: string;
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    id: 'home',
    items: [
      { id: 'home', label: 'Ana Səhifə', icon: Home, path: '/' }
    ]
  },
  {
    id: 'categories',
    title: 'Məlumat Kateqoriyaları',
    items: [
      {
        id: 'demographic',
        label: 'Demoqrafik və sosial statistika',
        icon: Users,
        children: [
          { id: 'population', label: 'Əhali', path: '/dashboard/demographic/population' },
          { id: 'labor', label: 'Əmək bazarı', path: '/dashboard/demographic/labor' },
          { id: 'education', label: 'Təhsil, elm və mədəniyyət', path: '/dashboard/demographic/education' },
          { id: 'health', label: 'Səhiyyə, sosial müdafiə, idman', path: '/dashboard/demographic/health' },
          { id: 'crime', label: 'Cinayətkarlıq və hüquqpozmalar', path: '/dashboard/demographic/crime' }
        ]
      },
      {
        id: 'economy',
        label: 'İqtisadi statistika',
        icon: TrendingUp,
        children: [
          { id: 'national-accounts', label: 'Milli hesablar sistemi', path: '/dashboard/economy/accounts' },
          { id: 'agriculture', label: 'Kənd təsərrüfatı və balıqçılıq', path: '/dashboard/economy/agriculture' },
          { id: 'industry', label: 'Sənaye', path: '/dashboard/economy/industry' },
          { id: 'energy', label: 'Energetika', path: '/dashboard/economy/energy' },
          { id: 'construction', label: 'Tikinti', path: '/dashboard/economy/construction' },
          { id: 'trade', label: 'Ticarət', path: '/dashboard/economy/trade' },
          { id: 'transport', label: 'Nəqliyyat', path: '/dashboard/economy/transport' },
          { id: 'telecom', label: 'Telekommunikasiya və poçt', path: '/dashboard/economy/telecom' },
          { id: 'finance', label: 'Maliyyə və bank', path: '/dashboard/economy/finance' },
          { id: 'price', label: 'Qiymət', path: '/dashboard/economy/price' },
          { id: 'tourism', label: 'Turizm', path: '/dashboard/economy/tourism' }
        ]
      },
      {
        id: 'environment',
        label: 'Ətraf mühit və digər sahələr',
        icon: Leaf,
        children: [
          { id: 'ecology', label: 'Ətraf mühitin mühafizəsi', path: '/dashboard/environment/ecology' },
          { id: 'regions', label: 'Regionlar', path: '/dashboard/environment/regions' },
          { id: 'household', label: 'Ev təsərrüfatları', path: '/dashboard/environment/household' },
          { id: 'gender', label: 'Gender', path: '/dashboard/environment/gender' },
          { id: 'digital', label: 'Rəqəmsal inkişaf', path: '/dashboard/environment/digital' }
        ]
      },
      {
        id: 'geo',
        label: 'Coğrafi məlumatlar',
        icon: Map,
        children: [
          { id: 'maps', label: 'Xəritələr', path: '/dashboard/geo/maps' },
          { id: 'geojson', label: 'GeoJSON Faylları', path: '/dashboard/geo/geojson' },
          { id: 'kmz', label: 'KMZ Faylları', path: '/dashboard/geo/kmz' }
        ]
      }
    ]
  },
  {
    id: 'developer',
    items: [
      { id: 'dev-portal', label: 'Developer Portal', icon: Code2, path: '/developer' }
    ]
  }
];