import {
  Home, Users, TrendingUp, Leaf, Map, Code2, LucideIcon
} from 'lucide-react';
import { TranslationKey } from '../i18n/translations';

export interface NavItem {
  id: string;
  labelKey: TranslationKey;   // ← YENİ: tərcümə açarı
  icon?: LucideIcon;
  path?: string;
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  titleKey?: TranslationKey;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    id: 'home',
    items: [
      { id: 'home', labelKey: 'nav.home', icon: Home, path: '/' }
    ]
  },
  {
    id: 'categories',
    titleKey: 'nav.categories',
    items: [
      {
        id: 'demographic',
        labelKey: 'cat.demographic',
        icon: Users,
        children: [
          { id: 'population', labelKey: 'cat.population', path: '/dashboard/demographic/population' },
          { id: 'labor', labelKey: 'cat.labor', path: '/dashboard/demographic/labor' },
          { id: 'education', labelKey: 'cat.education', path: '/dashboard/demographic/education' },
          { id: 'health', labelKey: 'cat.health', path: '/dashboard/demographic/health' },
          { id: 'crime', labelKey: 'cat.crime', path: '/dashboard/demographic/crime' }
        ]
      },
      {
        id: 'economy',
        labelKey: 'cat.economy',
        icon: TrendingUp,
        children: [
          { id: 'national-accounts', labelKey: 'cat.national-accounts', path: '/dashboard/economy/accounts' },
          { id: 'agriculture', labelKey: 'cat.agriculture', path: '/dashboard/economy/agriculture' },
          { id: 'industry', labelKey: 'cat.industry', path: '/dashboard/economy/industry' },
          { id: 'energy', labelKey: 'cat.energy', path: '/dashboard/economy/energy' },
          { id: 'construction', labelKey: 'cat.construction', path: '/dashboard/economy/construction' },
          { id: 'trade', labelKey: 'cat.trade', path: '/dashboard/economy/trade' },
          { id: 'transport', labelKey: 'cat.transport', path: '/dashboard/economy/transport' },
          { id: 'telecom', labelKey: 'cat.telecom', path: '/dashboard/economy/telecom' },
          { id: 'finance', labelKey: 'cat.finance', path: '/dashboard/economy/finance' },
          { id: 'price', labelKey: 'cat.price', path: '/dashboard/economy/price' },
          { id: 'tourism', labelKey: 'cat.tourism', path: '/dashboard/economy/tourism' }
        ]
      },
      {
        id: 'environment',
        labelKey: 'cat.environment',
        icon: Leaf,
        children: [
          { id: 'ecology', labelKey: 'cat.ecology', path: '/dashboard/environment/ecology' },
          { id: 'regions', labelKey: 'cat.regions', path: '/dashboard/environment/regions' },
          { id: 'household', labelKey: 'cat.household', path: '/dashboard/environment/household' },
          { id: 'gender', labelKey: 'cat.gender', path: '/dashboard/environment/gender' },
          { id: 'digital', labelKey: 'cat.digital', path: '/dashboard/environment/digital' }
        ]
      },
      {
        id: 'geo',
        labelKey: 'cat.geo',
        icon: Map,
        children: [
          { id: 'maps', labelKey: 'cat.maps', path: '/dashboard/geo/maps' },
          { id: 'geojson', labelKey: 'cat.geojson', path: '/dashboard/geo/geojson' },
          { id: 'kmz', labelKey: 'cat.kmz', path: '/dashboard/geo/kmz' }
        ]
      }
    ]
  },
  {
    id: 'developer',
    items: [
      { id: 'dev-portal', labelKey: 'nav.developer', icon: Code2, path: '/developer' }
    ]
  }
];