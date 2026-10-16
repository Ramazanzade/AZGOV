import { useMemo } from 'react';
import { useDatasets } from './useDatasets';
import { SUPER_GROUPS, SuperGroup } from '../config/categoryGroups';

// Slug → Azərbaycan dilində göstərilən ad
const SLUG_LABELS: Record<string, string> = {
  population: 'Əhali',
  labor: 'Əmək bazarı',
  education: 'Təhsil, elm və mədəniyyət',
  health: 'Səhiyyə, sosial müdafiə, idman',
  culture: 'Mədəniyyət və incəsənət',
  industry: 'Sənaye',
  agriculture: 'Kənd təsərrüfatı, meşə təsərrüfatı və balıqçılıq',
  transport: 'Nəqliyyat',
  digital: 'Rəqəmsal inkişaf',
  geo: 'Coğrafi məlumatlar',
  other: 'Digər',
};

export interface NavLeaf {
  id: string;
  name: string;
  path: string;
  count: number;
}

export interface NavGroup extends SuperGroup {
  categories: NavLeaf[];
}

export function useGroupedNavigation() {
  const { datasets, loading, error } = useDatasets();

  // DB-dəki bütün unikal slug-ları topla
  const slugCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    datasets.forEach(d => {
      const slug = (d as any).group || (d as any).category;
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [datasets]);

  const groups: NavGroup[] = useMemo(() => {
    return SUPER_GROUPS.map(g => ({
      ...g,
      categories: g.rootNames
        .filter(slug => slugCounts[slug] > 0) // yalnız dataseti olan slug-lar
        .map(slug => ({
          id: slug,
          name: SLUG_LABELS[slug] || slug,
          path: `/browse/${g.id}/${slug}`,
          count: slugCounts[slug] || 0,
        })),
    })).filter(g => g.categories.length > 0); // boş qrupları gizlət
  }, [slugCounts]);

  return { groups, orphans: [], loading, error };
}