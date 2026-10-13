// hooks/useStats.ts
import { useEffect, useState } from 'react';
import axios from 'axios';

// Eyni baseURL-i istifadə edirik
const api = axios.create({ baseURL: '/api/v1/dashboard', timeout: 30000 });

export const useStats = () => {
    const [stats, setStats] = useState({
        total_datasets: 0,
        total_formats: 0,
        total_organizations: 0,
        top_category: '—',
        byGroup: {} as Record<string, number>,
    });

    useEffect(() => {
        // ✅ Nisbi URL — Vite proxy bunu 5000-ə yönləndirəcək
        api.get('/stats')
            .then(res => {
                const json = res.data;
                setStats({
                    total_datasets: json.total_datasets || 0,
                    total_formats: json.total_formats || 0,
                    total_organizations: json.total_organizations || 0,
                    top_category: json.top_category || '—',
                    byGroup: json.byGroup || {},
                });
            })
            .catch(err => console.error('Stats xətası:', err));
    }, []);

    return stats;
};