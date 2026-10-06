import { useEffect, useState } from 'react';
import axios from 'axios';

interface Stats {
  total: number;
  byFormat: Record<string, number>;
  byOrganization: Record<string, number>;
  byGroup: Record<string, number>;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    axios.get('/api/v1/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  return stats;
};