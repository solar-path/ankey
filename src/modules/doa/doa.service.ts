/**
 * DOA (Delegation of Authority) Service
 *
 * ⚠️ MIGRATION NEEDED: This module needs PostgreSQL migration
 * TODO: Migrate to PostgreSQL-centered architecture following ARCHITECTURE.md
 * - Create src/modules/doa/doa.sql with PostgreSQL functions
 * - Update this service to thin client pattern (API calls only)
 * - Remove direct database access
 *
 * TEMPORARY: All methods return empty data until migration is complete
 */

import type { ApprovalMatrix } from "@/modules/shared/types/database.types";

export class DOAService {
  /**
   * Get all approval matrices for a company
   * TODO: Implement via PostgreSQL function call
   */
  static async getMatrices(_companyId: string): Promise<ApprovalMatrix[]> {
    console.warn("[DOAService] getMatrices: Not implemented - awaiting PostgreSQL migration");
    return [];
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
