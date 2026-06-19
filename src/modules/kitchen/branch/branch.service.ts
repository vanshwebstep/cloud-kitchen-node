import DebugHelper from '../../../core/helpers/debug.js';
import branchRepo from './branch.repository.js';
import { Status } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../../lib/prisma.js';
import stringHelper from '../../../core/helpers/string.helper.js';

// =====================================================
// ✅ CREATE BRANCH
// =====================================================
export const createBranch = async (data: {
    kitchenId: number;
    name: string;
    addressLine1: string;
    addressLine2: string;
    landmark: string;
    area: string;
    pincode: string;
    countryId: number;
    stateId: number;
    cityId: number;
    contactTitle: string;
    contactFirstName: string;
    contactLastName: string;
    contactEmail: string;
    contactPhone: string;
    cuisines: Array<{
        id?: number;
        name?: string;
    }>;
}) => {
    const { kitchenId, name, addressLine1, addressLine2, landmark, area, pincode, countryId, stateId, cityId, contactTitle, contactFirstName, contactLastName, contactEmail, contactPhone, cuisines } = data;

    DebugHelper.debug('[Branch Service] Saving new branch to database...');

    DebugHelper.debug('[Branch Service] Data: ', JSON.stringify(data, null, 2));

    try {
        // ===============================================
        // 🧠 TRANSACTION START
        // ===============================================
        const result = await prisma.$transaction(async (tx) => {

            // ===============================================
            // 1️⃣ CREATE BRANCH
            // ===============================================
            const branch = await tx.branch.create({
                data: {
                    user: {
                        connect: {
                            id: kitchenId
                        }
                    },
                    name,
                    addressLine1,
                    addressLine2,
                    landmark,
                    area,
                    pincode,
                    country: {
                        connect: {
                            id: countryId
                        }
                    },
                    state: {
                        connect: {
                            id: stateId
                        }
                    },
                    city: {
                        connect: {
                            id: cityId
                        }
                    },
                    contactTitle,
                    contactFirstName,
                    contactLastName,
                    contactEmail,
                    contactPhone
                }
            });

            // ===============================================
            // 2️⃣ PROCESS CUISINES (OPTIMIZED)
            // ===============================================

            // ✅ Safety check
            if (!Array.isArray(cuisines)) {
                throw new Error("Cuisines must be an array");
            }

            // 👉 Normalize + split
            const ids = cuisines
                .filter(c => c.id)
                .map(c => Number(c.id));

            const names = cuisines
                .filter(c => !c.id && c.name)
                .map(c => c.name!.trim().toLowerCase());

            // 👉 Remove duplicate names
            const uniqueNames = [...new Set(names)];

            // ===============================================
            // 1️⃣ VALIDATE IDS (Single Query)
            // ===============================================
            let existingIds: number[] = [];

            if (ids.length > 0) {
                const existing = await tx.cuisine.findMany({
                    where: { id: { in: ids } },
                    select: { id: true }
                });

                if (existing.length !== ids.length) {
                    throw new Error("Some cuisine IDs are invalid");
                }

                existingIds = existing.map(c => Number(c.id));
            }

            // ===============================================
            // 2️⃣ UPSERT NAMES (Parallel)
            // ===============================================
            let createdIds: number[] = [];

            if (uniqueNames.length > 0) {
                const created = await Promise.all(
                    uniqueNames.map(name =>
                        tx.cuisine.upsert({
                            where: { name },
                            update: {},
                            create: {
                                name: stringHelper.toTitleCase(name),
                                status: Status.PENDING
                            }
                        })
                    )
                );

                createdIds = created.map(c => Number(c.id));
            }

            // ===============================================
            // 3️⃣ MERGE ALL IDS
            // ===============================================
            const cuisineIds = [...existingIds, ...createdIds];

            // ===============================================
            // 4️⃣ CREATE MAPPING
            // ===============================================
            if (cuisineIds.length > 0) {
                await tx.branchCuisine.createMany({
                    data: cuisineIds.map(cid => ({
                        branchId: branch.id,
                        cuisineId: cid
                    })),
                    skipDuplicates: true
                });
            }

            return branch;
        });

        return {
            status: true,
            data: result,
            message: 'Branch created successfully'
        };

    } catch (error: any) {
        DebugHelper.debugError('[Branch Service] Error:', error);

        return {
            status: false,
            message: error.message || 'Failed to create branch'
        };
    }
};

// =====================================================
// 📄 GET ALL BRANCHES
// =====================================================
export const getBranches = async (params: {
    page: number;
    limit: number;
    filters: {
        kitchenId: number;
        countryId?: number;
        stateId?: number;
        cityId?: number;
        name?: string;
        pincode?: string;
    };
}) => {
    try {
        const { page, limit, filters } = params;

        const skip = (page - 1) * limit;

        DebugHelper.debug(`[Cuisine Service] Fetching branches | Page: ${page}`);

        // ===============================================
        // 🔍 BUILD WHERE FILTER
        // ===============================================
        const where: any = {};

        // 🔥 mandatory (multi-tenant safety)
        where.userId = BigInt(filters.kitchenId);

        if (filters.countryId) {
            where.countryId = BigInt(filters.countryId);
        }

        if (filters.stateId) {
            where.stateId = BigInt(filters.stateId);
        }

        if (filters.cityId) {
            where.cityId = BigInt(filters.cityId);
        }

        if (filters.pincode) {
            where.pincode = filters.pincode;
        }

        if (filters.name) {
            where.name = {
                contains: filters.name
            };
        }

        // ===============================================
        // 📦 FETCH DATA
        // ===============================================
        const [dataRes, filteredCountRes, totalCountRes] = await Promise.all([
            branchRepo.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),

            // filtered count
            branchRepo.count({ where }),

            // total count (without filter)
            branchRepo.count(),
        ]);

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

                total,        // 🔥 total records (all)
                filtered,     // 🔥 after filter
                count: data.length, // 🔥 current page items

                totalPages,   // 🔥 total pages possible

                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    } catch (error: any) {
        DebugHelper.debugError(`[Branche Service] getBranches failed: ${error.message}`);

        return {
            status: false,
            message: "Failed to fetch branches",
            data: [],
            meta: null,
        };
    }
};

// =====================================================
// 🔍 GET BRANCH BY ID
// =====================================================
export const getBranchById = async (id: bigint) => {
    try {
        DebugHelper.debug(`[Branch Service] Fetching branch: ${id}`);

        const response = await branchRepo.findUnique({
            where: { id }
        });

        if (!response?.data) {
            return {
                status: false,
                message: 'Branch not found'
            };
        }

        return {
            status: true,
            data: response.data
        };

    } catch (error: any) {
        DebugHelper.debugError(`[Branch Service] getBranchById failed: ${error.message}`);

        return {
            status: false,
            message: 'Something went wrong'
        };
    }
};

// =====================================================
// ✏️ UPDATE BRANCH
// =====================================================
export const updateBranch = async (
    id: bigint,
    data: any
) => {
    try {
        DebugHelper.debug(`[Branch Service] Updating branch: ${id}`);

        const existing = await branchRepo.findUnique({
            where: { id }
        });

        if (!existing?.data) {
            return {
                status: false,
                message: 'Branch not found'
            };
        }

        const response = await branchRepo.update(Number(id), data);

        if (!response.status) {
            return {
                status: false,
                message: response.message || 'Failed to update branch'
            };
        }

        return {
            status: true,
            message: 'Branch updated successfully',
            data: response.data
        };

    } catch (error: any) {
        DebugHelper.debugError(`[Branch Service] updateBranch failed: ${error.message}`);

        return {
            status: false,
            message: 'Something went wrong while updating branch'
        };
    }
};

// =====================================================
// ❌ DELETE BRANCH (SOFT DELETE)
// =====================================================
export const deleteBranch = async (id: bigint) => {
    try {
        DebugHelper.debug(`[Branch Service] Deleting branch: ${id}`);

        const existing = await branchRepo.findUnique({
            where: { id }
        });

        if (!existing?.data) {
            return {
                status: false,
                message: 'Branch not found'
            };
        }

        // 🔹 Soft delete
        const response = await branchRepo.update(Number(id), {
            status: Status.INACTIVE
        });

        if (!response.status) {
            return {
                status: false,
                message: 'Failed to delete branch'
            };
        }

        return {
            status: true,
            message: 'Branch deleted successfully'
        };

    } catch (error: any) {
        DebugHelper.debugError(`[Branch Service] deleteBranch failed: ${error.message}`);

        return {
            status: false,
            message: 'Something went wrong while deleting branch'
        };
    }
};

// =====================================================
// 🔄 TOGGLE STATUS
// =====================================================
export const updateBranchStatus = async (id: bigint, status: Status) => {
    try {
        DebugHelper.debug(`[Branch Service] Updating status: ${id} -> ${status}`);

        const existing = await branchRepo.findUnique({
            where: { id: Number(id) }
        });

        if (!existing?.data) {
            return {
                status: false,
                message: 'Branch not found'
            };
        }

        // ❌ optional: prevent same update
        if (existing.data.status === status) {
            return {
                status: false,
                message: `Branch already ${status}`
            };
        }

        const response = await branchRepo.update(Number(id), {
            status
        });

        return {
            status: true,
            message: 'Branch status updated successfully',
            data: response.data
        };

    } catch (error: any) {
        DebugHelper.debugError(`[Branch Service] updateBranchStatus failed: ${error.message}`);

        return {
            status: false,
            message: 'Something went wrong'
        };
    }
};