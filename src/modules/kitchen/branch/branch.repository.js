// src/modules/admin/admin/admin.repository.ts
import { prisma } from "../../../../lib/prisma";
import stringHelper from "../../../core/helpers/string.helper";
const branchRepo = {
    // ---------- Find Admin(Unique) ----------
    async findUnique(options) {
        try {
            if (!options.where) {
                throw new Error("Unique filter (where) is required");
            }
            const branch = await prisma.branch.findUnique(options);
            if (!branch) {
                return {
                    status: false,
                    message: "Branch not found",
                };
            }
            return {
                status: true,
                data: stringHelper.convertBigInt(branch, "number"),
                message: branch ? "Admin record retrieved successfully" : "Admin not found",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to retrieve branch record",
            };
        }
    },
    // ---------- Find Admin(First Match) ----------
    async findFirst(options) {
        try {
            if (!options.where) {
                throw new Error("Filter (where) is required");
            }
            const branch = await prisma.branch.findFirst(options);
            if (!branch) {
                return {
                    status: false,
                    message: "Branch not found",
                };
            }
            return {
                status: true,
                data: stringHelper.convertBigInt(branch, "number"),
                message: branch ? "Admin record retrieved successfully" : "Admin not found",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to retrieve branch record",
            };
        }
    },
    // ---------- Find Multiple Admins ----------
    async findMany(options = {}) {
        try {
            const branchs = await prisma.branch.findMany(options);
            return {
                status: true,
                data: stringHelper.convertBigInt(branchs, "number"),
                message: "Admin records retrieved successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Unable to retrieve branch records",
            };
        }
    },
    // ---------- Count Admins ----------
    async count(options = {}) {
        try {
            const count = await prisma.branch.count({
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
                message: err.message || "Unable to count branch records",
            };
        }
    },
    // ---------- Create Admin ----------
    async create(data, options = {}) {
        try {
            const branch = await prisma.branch.create({
                data,
                ...options,
            });
            return {
                status: true,
                data: stringHelper.convertBigInt(branch, "number"),
                message: "Admin created successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to create branch",
            };
        }
    },
    // ---------- Create Many Branchs ----------
    async createMany(options) {
        try {
            if (!options.data || (Array.isArray(options.data) && options.data.length === 0)) {
                return {
                    status: false,
                    message: "No data provided for createMany",
                };
            }
            const result = await prisma.branch.createMany({
                ...options,
                skipDuplicates: options.skipDuplicates ?? true, // safe default — skips already-assigned permissions
            });
            return {
                status: true,
                data: { count: result.count },
                message: `${result.count} Branch record(s) created successfully`,
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to create branch records",
            };
        }
    },
    // ---------- Delete Many Branchs ----------
    async deleteMany(options) {
        try {
            if (!options.where) {
                throw new Error("Filter (where) is required for deleteMany");
            }
            const result = await prisma.branch.deleteMany({
                where: options.where,
            });
            return {
                status: true,
                data: { count: result.count },
                message: `${result.count} Branch record(s) deleted successfully`,
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to delete branch records",
            };
        }
    },
    // ---------- Update Admin ----------
    async update(id, data, options = {}) {
        try {
            const branch = await prisma.branch.update({
                where: { id },
                data,
                ...options,
            });
            return {
                status: true,
                data: stringHelper.convertBigInt(branch, "number"),
                message: "Admin updated successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to update branch",
            };
        }
    },
    // ---------- Delete Admin ----------
    async delete(where, options = {}) {
        try {
            const branch = await prisma.branch.delete({
                where,
                ...options,
            });
            return {
                status: true,
                data: stringHelper.convertBigInt(branch, "number"),
                message: "Admin deleted successfully",
            };
        }
        catch (err) {
            return {
                status: false,
                message: err.message || "Failed to delete branch",
            };
        }
    },
};
export default branchRepo;
