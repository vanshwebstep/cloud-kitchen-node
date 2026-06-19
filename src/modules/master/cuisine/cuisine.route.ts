import { Router } from 'express';
import * as CuisineController from './cuisine.controller.js';
import { validateGetCuisines } from './cuisine.validation.js';

const router = Router({
    mergeParams: true
});

// 📌 Get All cuisines
// GET /api/v1/kitchen/branch
router.get(
    '/',
    validateGetCuisines,
    CuisineController.getCuisines
);
export default router;