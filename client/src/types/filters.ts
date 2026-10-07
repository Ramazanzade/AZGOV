export interface DatasetFilters {
  search: string;
  format: string;      // 'ALL' | 'CSV' | 'JSON' | ...
  organization: string; // 'ALL' | təşkilat adı
  group: string;        // 'ALL' | qrup adı
  dateFrom: string;     // 'YYYY-MM-DD' | ''
  dateTo: string;       // 'YYYY-MM-DD' | ''
}

export const DEFAULT_FILTERS: DatasetFilters = {
  search: '',
  format: 'ALL',
  organization: 'ALL',
  group: 'ALL',
  dateFrom: '',
  dateTo: ''
};