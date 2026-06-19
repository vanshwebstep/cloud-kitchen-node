import { Router } from 'express';
import * as StockController from './stock.controller.js';
import { verifyToken } from '../../../auth/auth.middleware.js';
import { validateCreateStock } from './stock.validation.js';

const router = Router({
    mergeParams: true
});

// 📌 Create Stock
// POST /api/v1/kitchen/branch/:branchId/stock
router.post(
    '/',
    verifyToken({ checkOnboarding: true, checkSubscription: true }),
    validateCreateStock,
    StockController.createStock
);

// 📌 Get All Stocks
// GET /api/v1/kitchen/branch/:branchId/stock
router.get(
    '/',
    verifyToken({ checkOnboarding: true, checkSubscription: true }),
    StockController.getStocks
);

export default router;