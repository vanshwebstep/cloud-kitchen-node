// src/modules/admin/admin/admin.repository.ts
import { prisma } from "../../../../lib/prisma";
import stringHelper from "../../../core/helpers/string.helper";
const cuisineRepo = {
    // ---------- Find Admin(Unique) ----------
    async findUnique(options) {
        try {
            if (!options.where) {
                throw new Error("Unique filter (where) is required");
            }
            const cuisine = await prisma.cuisine.findUnique(options);
            if (!cuisine) {
                return {
                    status: false,
                    message: "Cuisine not found",
                };
            }
            return {
                status: true,
                data: stringHelper.convertBigInt(cuisine, "number"),
                message: cuisine ? "Admin record retrieved successfully" : "Admin not found",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to retrieve cuisine record",
            };
        }
    },
    // ---------- Find Admin(First Match) ----------
    async findFirst(options) {
        try {
            if (!options.where) {
                throw new Error("Filter (where) is required");
            }
            const cuisine = await prisma.cuisine.findFirst(options);
            if (!cuisine) {
                return {
                    status: false,
                    message: "Cuisine not found",
                };
            }
            return {
                status: true,
                data: stringHelper.convertBigInt(cuisine, "number"),
                message: cuisine ? "Admin record retrieved successfully" : "Admin not found",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to retrieve cuisine record",
            };
        }
    },
    // ---------- Find Multiple Admins ----------
    async findMany(options = {}) {
        try {
            const cuisines = await prisma.cuisine.findMany(options);
            return {
                status: true,
                data: stringHelper.convertBigInt(cuisines, "number"),
                message: "Admin records retrieved successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to retrieve cuisine records",
            };
        }
    },
    // ---------- Count Admins ----------
    async count(options = {}) {
        try {
            const count = await prisma.cuisine.count({
                where: options.where,
            });
            return {
                status: true,
                data: count,
                message: "Admin count retrieved successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to count cuisine records",
            };
        }
    },
    // ---------- Create Admin ----------
    async create(data, options = {}) {
        try {
            const cuisine = await prisma.cuisine.create({
                data,
                ...options,
            });
            return {
                status: true,
                data: stringHelper.convertBigInt(cuisine, "number"),
                message: "Admin created successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to create cuisine",
            };
        }
    },
    // ---------- Create Many Cuisines ----------
    async createMany(options) {
        try {
            if (!options.data || (Array.isArray(options.data) && options.data.length === 0)) {
                return {
                    status: false,
                    message: "No data provided for createMany",
                };
            }
            const result = await prisma.cuisine.createMany({
                ...options,
                skipDuplicates: options.skipDuplicates ?? true, // safe default — skips already-assigned permissions
            });
            return {
                status: true,
                data: { count: result.count },
                message: `${result.count} Cuisine record(s) created successfully`,
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to create cuisine records",
            };
        }
    },
    // ---------- Delete Many Cuisines ----------
    async deleteMany(options) {
        try {
            if (!options.where) {
                throw new Error("Filter (where) is required for deleteMany");
            }
            const result = await prisma.cuisine.deleteMany({
                where: options.where,
            });
            return {
                status: true,
                data: { count: result.count },
                message: `${result.count} Cuisine record(s) deleted successfully`,
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to delete cuisine records",
            };
        }
    },
    // ---------- Update Admin ----------
    async update(id, data, options = {}) {
        try {
            const cuisine = await prisma.cuisine.update({
                where: { id },
                data,
                ...options,
            });
            return {
                status: true,
                data: stringHelper.convertBigInt(cuisine, "number"),
                message: "Admin updated successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to update cuisine",
            };
        }
    },
    // ---------- Delete Admin ----------
    async delete(where, options = {}) {
        try {
            const cuisine = await prisma.cuisine.delete({
                where,
                ...options,
            });
            return {
                status: true,
                data: stringHelper.convertBigInt(cuisine, "number"),
                message: "Admin deleted successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to delete cuisine",
            };
        }
    },
};
export default cuisineRepo;
