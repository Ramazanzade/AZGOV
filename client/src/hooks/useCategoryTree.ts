import { useEffect, useState } from 'react';

export interface CategoryNode {
  id: number;
  name: string;
  parent_id: number | null;
  path: string;
  children: CategoryNode[];
}

const EXCLUDED_ROOTS = ['Ümumi (JSON)', 'client'];

export function useCategoryTree() {
  const [data, setData] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = (import.meta as any).env?.VITE_API_URL || '';
    fetch(`${base}/api/categories/tree`)
      .then(r => r.json())
      .then(json => {
        const roots: CategoryNode[] = (json.data || []).filter(
          (n: CategoryNode) => !EXCLUDED_ROOTS.includes(n.name)
        );
        setData(roots);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}