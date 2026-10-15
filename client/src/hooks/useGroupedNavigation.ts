import { useMemo } from 'react';
import { useCategoryTree, CategoryNode } from './useCategoryTree';
import { SUPER_GROUPS, SuperGroup } from '../config/categoryGroups';

export interface NavLeaf {
  id: number;
  name: string;
  path: string;
}

export interface NavGroup extends SuperGroup {
  categories: CategoryNode[]; // DB-dən gələn root-lar (children daxil)
}

export function useGroupedNavigation() {
  const { data: roots, loading, error } = useCategoryTree();

  const groups: NavGroup[] = useMemo(() => {
    if (!roots.length) return [];

    return SUPER_GROUPS.map(g => ({
      ...g,
      categories: roots.filter(r => g.rootNames.includes(r.name)),
    }));
  }, [roots]);

  // DB-də olub config-də olmayan köklər (debug üçün)
  const orphans = useMemo(() => {
    const allAssigned = SUPER_GROUPS.flatMap(g => g.rootNames);
    return roots.filter(r => !allAssigned.includes(r.name));
  }, [roots]);

  return { groups, orphans, loading, error };
}