import { Request, Response } from 'express';
import { fetchAllPackages, fetchAndParseDataset } from '../services/opendataService';

// Bütün datasetləri gətirir
export const getAllDatasets = async (req: Request, res: Response) => {
  try {
    const rows = Number(req.query.rows) || 500;
    const datasets = await fetchAllPackages();

    res.status(200).json({
      success: true,
      total: datasets.length,
      data: datasets
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Dinamik olaraq dataset çəkir
export const getDynamicData = async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Metadata URL tələb olunur (?url=...)'
    });
  }

  try {
    const result = await fetchAndParseDataset(url);

    res.status(200).json({
      success: true,
      meta: {
        title: result.title,
        format: result.format,
        isGeoJSON: result.isGeoJSON,
        totalRecords: result.totalRecords
      },
      data: result.data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server xətası'
    });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const datasets = await fetchAllPackages();

    const formatCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};
    const orgCounts: Record<string, number> = {};

    datasets.forEach(d => {
      formatCounts[d.format] = (formatCounts[d.format] || 0) + 1;
      groupCounts[d.group] = (groupCounts[d.group] || 0) + 1;
      orgCounts[d.organization] = (orgCounts[d.organization] || 0) + 1;
    });

    res.json({
      success: true,
      total: datasets.length,
      byFormat: formatCounts,
      byGroup: groupCounts,
      byOrganization: orgCounts
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};