/**
 * DOA (Delegation of Authority) Service
 *
 * PostgreSQL-centered architecture - thin client layer
 * All business logic in PostgreSQL functions (src/api/db/doa.functions.sql)
 */

import { callFunction } from "@/lib/api";
import type { ApprovalMatrix } from "@/modules/shared/types/database.types";

export class DOAService {
  /**
   * Get all approval matrices for a company
   */
  static async getMatrices(companyId: string): Promise<ApprovalMatrix[]> {
    const result = await callFunction("doa.get_matrices", {
      company_id: companyId,
    });
    return result as ApprovalMatrix[];
  }

  /**
   * Get a single approval matrix by ID
   * TODO: Implement via PostgreSQL function call
   */
  static async getMatrix(_companyId: string, _matrixId: string): Promise<ApprovalMatrix> {
    console.warn("[DOAService] getMatrix: Not implemented - awaiting PostgreSQL migration");
    throw new Error("DOA module not yet migrated to PostgreSQL");
  }

  /**
   * Create a new approval matrix
   * TODO: Implement via PostgreSQL function call
   */
  static async createMatrix(
    _companyId: string,
    _data: Omit<ApprovalMatrix, "_id" | "_rev" | "type" | "companyId" | "createdAt" | "updatedAt" | "createdBy">,
    _userId: string
  ): Promise<ApprovalMatrix> {
    console.warn("[DOAService] createMatrix: Not implemented - awaiting PostgreSQL migration");
    throw new Error("DOA module not yet migrated to PostgreSQL");
  }

  /**
   * Update an existing approval matrix
   * TODO: Implement via PostgreSQL function call
   */
  static async updateMatrix(
    _companyId: string,
    _matrixId: string,
    _data: Partial<ApprovalMatrix>
  ): Promise<ApprovalMatrix> {
    console.warn("[DOAService] updateMatrix: Not implemented - awaiting PostgreSQL migration");
    throw new Error("DOA module not yet migrated to PostgreSQL");
  }

  /**
   * Delete an approval matrix
   * TODO: Implement via PostgreSQL function call
   */
  static async deleteMatrix(_companyId: string, _matrixId: string): Promise<void> {
    console.warn("[DOAService] deleteMatrix: Not implemented - awaiting PostgreSQL migration");
    throw new Error("DOA module not yet migrated to PostgreSQL");
  }

  /**
   * Get active matrix for a document type
   * TODO: Implement via PostgreSQL function call
   */
  static async getActiveMatrixForType(_companyId: string, _documentType: string): Promise<ApprovalMatrix | null> {
    console.warn("[DOAService] getActiveMatrixForType: Not implemented - awaiting PostgreSQL migration");
    return null;
  }
}
