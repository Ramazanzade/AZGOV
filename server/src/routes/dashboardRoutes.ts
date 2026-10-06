import { Router } from 'express';
import { getDynamicData, getAllDatasets, getStats } from '../controllers/dashboardController';

const router = Router();
router.get('/fetch-data', getDynamicData);
router.get('/datasets', getAllDatasets);
router.get('/stats', getStats);

export default router;