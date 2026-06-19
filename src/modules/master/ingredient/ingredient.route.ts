import { Router } from 'express';
import * as IngredienteController from './ingredient.controller.js';
import { validateGetIngredientes } from './ingredient.validation.js';

const router = Router({
    mergeParams: true
});

// 📌 Get All ingredientes
// GET /api/v1/kitchen/branch
router.get(
    '/',
    validateGetIngredientes,
    IngredienteController.getIngredientes
);
export default router;