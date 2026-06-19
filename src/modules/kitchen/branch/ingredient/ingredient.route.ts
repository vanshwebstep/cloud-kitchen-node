import { Router } from 'express';
import * as IngredientController from './ingredient.controller.js';
import { verifyToken } from '../../auth/auth.middleware.js';
import { validateCreateIngredient } from './ingredient.validation.js';
import stockRoutes from './stock/stock.route.js';

const router = Router({
    mergeParams: true
});

router.use('/stock', stockRoutes);

// 📌 Create Ingredient
// POST /api/v1/kitchen/branch/:branchId/ingredient
router.post(
    '/',
    verifyToken({ checkOnboarding: true, checkSubscription: true }),
    validateCreateIngredient,
    IngredientController.CreateIngredient
);

// 📌 Get All Ingredients
// GET /api/v1/kitchen/branch/:branchId/ingredient
router.get(
    '/',
    verifyToken({ checkOnboarding: true, checkSubscription: true }),
    IngredientController.getIngredients
);


export default router;