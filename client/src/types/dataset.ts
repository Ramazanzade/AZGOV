// types/dataset.ts
export interface DatasetSummary {
    id: number;
    resourceId: string;
    title: string;
    slug: string | null;
    organization: string | null;
    metadataUrl: string | null;
    resourceName: string | null;
    format: string;
    resourceUrl: string | null;
    storageUrl: string | null;    // ← Əlavə et
    key: string;
    group: string;
    categoryName: string | null;
    categoryPath: string | null;
    
    // Frontend üçün köhnə sahələr (nullable):
    tags?: string[];
    lastUpdated?: string;
}

export interface FetchedDataset {
    meta: {
        format: string;
        isGeoJSON: boolean;
        totalRecords: number;
        url?: string;
        fileName?: string; 
         corrupted?: boolean;          // ← ƏLAVƏ ET
        corruptionCount?: number;  
    };
    data: any;
}