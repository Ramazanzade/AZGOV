// hooks/useDatasets.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DatasetSummary } from '../types/dataset';
import { DatasetFilters } from '../types/filters';
import { getDatasets } from '../services/api';

export const useDatasets = (filters?: Partial<DatasetFilters>) => {
  // ✅ React Query — avtomatik cache, refetch, loading idarəetməsi
  const {
    data: datasets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => getDatasets(5000),
    staleTime: 30 * 60 * 1000,        // 30 dəqiqə stale olmasın
    gcTime: 60 * 60 * 1000,            // 1 saat cache-də saxla
    refetchOnWindowFocus: false,       // Pəncərə fokuslananda yenidən çəkmə
    retry: 1,
  });

  // ✅ Filter məntiqi eyni qalır
  const filtered = useMemo(() => {
    const f = filters || {};
    const q = (f.search || '').toLowerCase().trim();
    const list = Array.isArray(datasets) ? datasets : [];

    return list.filter(d => {
      // Axtarış
      if (q) {
        const title = (d.title || '').toLowerCase();
        const org = (d.organization || '').toLowerCase();
        const resourceName = ((d as any).resourceName || '').toLowerCase();
        
        const match =
          title.includes(q) ||
          org.includes(q) ||
          resourceName.includes(q);
        if (!match) return false;
      }

      // Format
      if (f.format && f.format !== 'ALL' && d.format !== f.format) return false;

      // Təşkilat
      if (f.organization && f.organization !== 'ALL' && d.organization !== f.organization) return false;

      // Qrup
      if (f.group && f.group !== 'ALL' && d.group !== f.group) return false;

      // Tarix aralığı
      if (f.dateFrom && (d as any).lastUpdated) {
        if (new Date((d as any).lastUpdated) < new Date(f.dateFrom)) return false;
      }
      if (f.dateTo && (d as any).lastUpdated) {
        if (new Date((d as any).lastUpdated) > new Date(f.dateTo)) return false;
      }

      return true;
    });
  }, [datasets, filters?.search, filters?.format, filters?.organization, filters?.group, filters?.dateFrom, filters?.dateTo]);

  // ✅ Filter üçün unikal dəyərlər (options) — eyni qalır
  const options = useMemo(() => {
    const orgs = new Set<string>();
    const groups = new Set<string>();
    const formats = new Set<string>();
    
    const list = Array.isArray(datasets) ? datasets : [];
    
    list.forEach(d => {
      if (d.organization) orgs.add(d.organization);
      if (d.group) groups.add(d.group);
      if (d.format) formats.add(d.format);
    });
    
    return {
      organizations: Array.from(orgs).sort(),
      groups: Array.from(groups).sort(),
      formats: Array.from(formats).sort()
    };
  }, [datasets]);

  return { 
    datasets, 
    filtered, 
    loading: isLoading, 
    error: error instanceof Error ? error.message : null, 
    options 
  };
};