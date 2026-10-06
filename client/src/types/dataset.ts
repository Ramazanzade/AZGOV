export interface DatasetSummary {
  id: string;
  name: string;
  title: string;
  organization: string;
  format: string;
  resourceUrl: string | null;
  metadataUrl: string;
  notes: string;
  tags: string[];
  lastUpdated: string;
   group: string;  
}

export interface FetchedDataset {
  meta: {
    title: string;
    format: string;
    isGeoJSON: boolean;
    totalRecords: number;
        corrupted?: boolean;        // ← əlavə edin
    corruptionCount?: number;
  };
  data: any;
}