/**
 * DOA (Delegation of Authority) Service
 *
 * Service for managing approval matrices in PouchDB.
 * Similar to orgchart-approval.service.ts but for DOA matrices.
 */

import { orgchartsDB } from "@/modules/shared/database/db";
import type { ApprovalMatrix } from "@/modules/shared/database/db";

export class DOAService {
  /**
   * Get all approval matrices for a company
   */
  static async getMatrices(companyId: string): Promise<ApprovalMatrix[]> {
    try {
      const result = await orgchartsDB.find({
        selector: {
          _id: { $gte: `company:${companyId}:matrix_`, $lte: `company:${companyId}:matrix_\ufff0` },
          type: "approval_matrix"
        }
      });

      // Sort manually since PouchDB requires index for sort
      const sorted = (result.docs as ApprovalMatrix[]).sort((a, b) => b.createdAt - a.createdAt);
      return sorted;
    } catch (error) {
      console.error("Error loading matrices:", error);
      throw new Error("Failed to load approval matrices");
    }
  }

  /**
   * Get a single approval matrix by ID
   */
  static async getMatrix(companyId: string, matrixId: string): Promise<ApprovalMatrix> {
    try {
      const fullId = matrixId.startsWith("company:")
        ? matrixId
        : `company:${companyId}:matrix_${matrixId}`;

      const matrix = await orgchartsDB.get(fullId) as ApprovalMatrix;

      if (matrix.type !== "approval_matrix") {
        throw new Error("Document is not an approval matrix");
      }

      return matrix;
    } catch (error) {
      console.error("Error loading matrix:", error);
      throw new Error("Failed to load approval matrix");
    }
  }

  /**
   * Create a new approval matrix
   */
  static async createMatrix(companyId: string, data: Omit<ApprovalMatrix, "_id" | "_rev" | "type" | "companyId" | "createdAt" | "updatedAt" | "createdBy">, userId: string): Promise<ApprovalMatrix> {
    try {
      const matrixId = `matrix_${Date.now()}_${crypto.randomUUID()}`;
      const matrix: ApprovalMatrix = {
        _id: `company:${companyId}:${matrixId}`,
        type: "approval_matrix",
        companyId,
        ...data,
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await orgchartsDB.put(matrix);
      return matrix;
    } catch (error) {
      console.error("Error creating matrix:", error);
      throw new Error("Failed to create approval matrix");
    }
  }

  /**
   * Update an existing approval matrix
   */
  static async updateMatrix(companyId: string, matrixId: string, data: Partial<ApprovalMatrix>): Promise<ApprovalMatrix> {
    try {
      const fullId = matrixId.startsWith("company:")
        ? matrixId
        : `company:${companyId}:matrix_${matrixId}`;

      const existing = await orgchartsDB.get(fullId) as ApprovalMatrix;

      if (existing.type !== "approval_matrix") {
        throw new Error("Document is not an approval matrix");
      }

      const updated: ApprovalMatrix = {
        ...existing,
        ...data,
        _id: existing._id,
        _rev: existing._rev,
        type: "approval_matrix",
        companyId: existing.companyId,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
      };

      await orgchartsDB.put(updated);
      return updated;
    } catch (error) {
      console.error("Error updating matrix:", error);
      throw new Error("Failed to update approval matrix");
    }
  }

  /**
   * Delete an approval matrix
   */
  static async deleteMatrix(companyId: string, matrixId: string): Promise<void> {
    try {
      const fullId = matrixId.startsWith("company:")
        ? matrixId
        : `company:${companyId}:matrix_${matrixId}`;

      const matrix = await orgchartsDB.get(fullId) as ApprovalMatrix;

      if (matrix.type !== "approval_matrix") {
        throw new Error("Document is not an approval matrix");
      }

      await orgchartsDB.remove(matrix._id, matrix._rev!);
    } catch (error) {
      console.error("Error deleting matrix:", error);
      throw new Error("Failed to delete approval matrix");
    }
  }

  /**
   * Get active matrix for a document type
   */
  static async getActiveMatrixForType(companyId: string, documentType: string): Promise<ApprovalMatrix | null> {
    try {
      const result = await orgchartsDB.find({
        selector: {
          _id: { $gte: `company:${companyId}:matrix_`, $lte: `company:${companyId}:matrix_\ufff0` },
          type: "approval_matrix",
          documentType,
          status: "active"
        },
        limit: 1
      });

      return result.docs.length > 0 ? result.docs[0] as ApprovalMatrix : null;
    } catch (error) {
      console.error("Error finding active matrix:", error);
      return null;
    }
  }
}
