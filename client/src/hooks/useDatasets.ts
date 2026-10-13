import { useEffect, useState, useMemo } from 'react';
import { getDatasets } from '../services/api';
import { DatasetSummary } from '../types/dataset';
import { DatasetFilters } from '../types/filters';

export const useDatasets = (filters?: Partial<DatasetFilters>) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDatasets()
      .then(data => {
        if (!active) return;
        // Müdafiəçi kod: həmişə array olsun
        const safeData = Array.isArray(data) ? data : [];
        setDatasets(safeData);
        setError(null);
      })
      .catch(e => {
        if (active) {
          setError(e.message);
          setDatasets([]); // Xəta olsa da, boş array saxla
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const f = filters || {};
    const q = (f.search || '').toLowerCase().trim();

    // Müdafiəçi: datasets array deyilsə boş array kimi qəbul et
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

  // Filter üçün unikal dəyərlər (options)
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

  return { datasets, filtered, loading, error, options };
};