import * as IngredienteService from './ingredient.service';
import { debug, debugError } from '../../../core/helpers/debug';
// =====================================================
// 📄 GET ALL BRANCHES
// =====================================================
export const getIngredientes = async (req, res) => {
    debug('=== GET BRANCHES START ===');
    try {
        const { page = 1, limit = 10, name, category, status } = req.validatedQuery;
        const result = await IngredienteService.getIngredientes({
            page: Number(page),
            limit: Number(limit),
            filters: {
                name,
                category,
                status
            }
        });
        return res.status(200).json({
            status: true,
            message: 'Ingredientes fetched successfully',
            data: result.data,
            meta: result.meta
        });
    }
    catch (error) {
        debugError('❌ Controller Error:', error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
    finally {
        debug('=== GET BRANCHES END ===');
    }
};
