// routes/v1/index.ts

import { Router } from 'express';
import systemRoutes from '../../modules/system';
import kitchenRoutes from '../../modules/kitchen/kitchen.route';
import masterRoutes from '../../modules/master/master.route';

const router = Router({
    mergeParams: true
});

// Combine all module routes here
router.use('/system', systemRoutes);

router.use('/kitchen', kitchenRoutes);

router.use('/master', masterRoutes);

export default router;