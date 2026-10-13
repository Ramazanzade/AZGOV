import { Router } from 'express';
import { OpendataController } from '../controllers/opendataController';

const router = Router();

// 1. Statistikalar
router.get('/stats', OpendataController.getStats);

// 2. Dataset siyahısı
router.get('/datasets', OpendataController.getDatasets);

// 3. Tək dataset-in məzmunu (PDF, Excel, CSV, ZIP və s.)
router.get('/:id/content', OpendataController.getContent);

export default router;