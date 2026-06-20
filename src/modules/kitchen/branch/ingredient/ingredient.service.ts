import DebugHelper from '../../../../core/helpers/debug';
import { Status, Unit } from '../../../../../prisma/generated/prisma/client';
import { prisma } from '../../../../../lib/prisma';
import stringHelper from '../../../../core/helpers/string.helper';
import ingredientRepo from './ingredient.repository';
import debugHelper from '../../../../core/helpers/debug';

// =====================================================
// ✅ CREATE INGREDIENT
// =====================================================
export const createIngredient = async (data: {
    kitchenId: number;
    branchId: number;
    ingredients: Array<{
        id?: number;
        name?: string;
        category?: string;
        image?: string;
        unit?: Unit;
    }>;
}) => {

    const { kitchenId, branchId, ingredients } = data;

    DebugHelper.debug('[Ingredient Service] Saving ingredients to inventory...');

    DebugHelper.debug(
        '[Ingredient Service] Data:',
        JSON.stringify(data, null, 2)
    );

    try {

        // ===============================================
        // 🧠 TRANSACTION START
        // ===============================================
        const result = await prisma.$transaction(async (tx) => {

            // ===============================================
            // ✅ SAFETY CHECK
            // ===============================================
            if (!Array.isArray(ingredients)) {
                throw new Error('Ingredients must be an array');
            }

            // ===============================================
            // 🧹 NORMALIZE DATA
            // ===============================================
            const ingredientIds = ingredients
                .filter(i => i.id)
                .map(i => Number(i.id));

            const newIngredients = ingredients
                .filter(i => !i.id && i.name && i.category)
                .map(i => ({
                    name: i.name!.trim().toLowerCase(),
                    category: i.category!.trim(),
                    image: i.image,
                    unit: i.unit || Unit.ITEM
                }));

            // ===============================================
            // 🛡️ REMOVE DUPLICATES
            // ===============================================
            const uniqueIngredients = Array.from(
                new Map(
                    newIngredients.map(i => [i.name, i])
                ).values()
            );

            // ===============================================
            // 1️⃣ VALIDATE EXISTING IDS
            // ===============================================
            let existingIngredientIds: number[] = [];

            if (ingredientIds.length > 0) {

                const existingIngredients = await tx.ingredient.findMany({
                    where: {
                        id: {
                            in: ingredientIds
                        }
                    },
                    select: {
                        id: true
                    }
                });

                if (existingIngredients.length !== ingredientIds.length) {
                    throw new Error('Some ingredient IDs are invalid');
                }

                existingIngredientIds = existingIngredients.map(
                    i => Number(i.id)
                );
            }

            // ===============================================
            // 2️⃣ CREATE / GET INGREDIENTS
            // ===============================================
            let createdIngredientIds: number[] = [];

            if (uniqueIngredients.length > 0) {

                const createdIngredients = await Promise.all(

                    uniqueIngredients.map(item =>

                        tx.ingredient.upsert({

                            where: {
                                name: item.name
                            },

                            update: {},

                            create: {
                                name: stringHelper.toTitleCase(item.name),
                                category: stringHelper.toTitleCase(item.category),
                                image: item.image,
                                status: Status.PENDING
                            }
                        })
                    )
                );

                createdIngredientIds = createdIngredients.map(
                    i => Number(i.id)
                );
            }

            // ===============================================
            // 3️⃣ MERGE ALL IDS
            // ===============================================
            const finalIngredientIds = [
                ...existingIngredientIds,
                ...createdIngredientIds
            ];

            // ===============================================
            // 4️⃣ CREATE BRANCH INVENTORY MAPPING
            // ===============================================
            if (finalIngredientIds.length > 0) {

                const inventoryPayload = finalIngredientIds.map(id => {

                    const ingredientData = ingredients.find(
                        i => Number(i.id) === id
                    );

                    return {
                        kitchenId,
                        branchId,
                        ingredientId: id,
                        unit: ingredientData?.unit || Unit.ITEM
                    };
                });

                await tx.branchIngredientInventory.createMany({
                    data: inventoryPayload,
                    skipDuplicates: true
                });
            }

            // ===============================================
            // 5️⃣ RETURN INVENTORY
            // ===============================================
            return await tx.branchIngredientInventory.findMany({
                where: {
                    kitchenId,
                    branchId
                },
                include: {
                    ingredient: true
                },
                orderBy: {
                    id: 'desc'
                }
            });

        });

        DebugHelper.debug(
            '[Ingredient Service] Ingredients saved successfully',
            JSON.stringify(stringHelper.convertBigInt(result, "number"), null, 2)
        );

        return {
            status: true,
            data: stringHelper.convertBigInt(result, "number"),
            message: 'Ingredients added successfully'
        };

    } catch (error: any) {

        DebugHelper.debugError(
            '[Ingredient Service] Error:',
            error
        );

        return {
            status: false,
            message: error.message || 'Failed to add ingredients'
        };
    }
};

// =====================================================
// 📄 GET ALL INGREDIENTS
// =====================================================
export const getIngredients = async (params: {
    page: number;
    limit: number;
    filters: {
        kitchenId: number;
        branchId: number;
        name?: string;
        category?: string;
    };
}) => {

    try {

        const { page, limit, filters } = params;

        debugHelper.debug(
            `[Ingredient Service] Fetching ingredients | Page: ${page}`,
            filters
        )

        const skip = (page - 1) * limit;

        DebugHelper.debug(
            `[Ingredient Service] Fetching Ingredients | Page: ${page}`
        );

        // ===============================================
        // 🔍 BUILD WHERE FILTER
        // ===============================================
        const where: any = {
            // 🔥 multi-tenant safety
            kitchenId: BigInt(filters.kitchenId),
            branchId: BigInt(filters.branchId)
        };

        // 🔍 ingredient name filter
        if (filters.name) {
            where.ingredient = {
                ...(where.ingredient || {}),
                name: {
                    contains: filters.name.trim()
                }
            };
        }

        // 🔍 ingredient category filter
        if (filters.category) {
            where.ingredient = {
                ...(where.ingredient || {}),
                category: {
                    contains: filters.category.trim()
                }
            };
        }

        // ===============================================
        // 📦 FETCH DATA
        // ===============================================
        const [
            dataRes,
            filteredCountRes,
            totalCountRes
        ] = await Promise.all([

            // ===========================================
            // 🔥 DATA
            // ===========================================
            ingredientRepo.findMany({
                where,
                select: {
                    id: true,
                    kitchenId: true,
                    branchId: true,
                    ingredientId: true,
                    unit: true,
                    createdAt: true,
                    ingredient: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            category: true,
                            status: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),

            // ===========================================
            // 🔥 FILTERED COUNT
            // ===========================================
            ingredientRepo.count({
                where
            }),

            // ===========================================
            // 🔥 TOTAL COUNT
            // ===========================================
            ingredientRepo.count({
                where: {
                    kitchenId: BigInt(filters.kitchenId),
                    branchId: BigInt(filters.branchId)
                }
            })
        ]);

        // ===============================================
        // 🧹 FORMAT RESPONSE
        // ===============================================
        const data = dataRes.data || [];
        const filtered = filteredCountRes.data || 0;
        const total = totalCountRes.data || 0;

        const totalPages = Math.ceil(filtered / limit);

        return {
            status: true,
            data,
            meta: {
                page,
                limit,
                total,
                filtered,
                count: data.length,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

    } catch (error: any) {

        DebugHelper.debugError(
            `[Ingredient Service] getIngredients failed: ${error.message}`
        );

        return {
            status: false,
            message: error.message || 'Failed to fetch ingredients',
            data: [],
            meta: null
        };
    }
};