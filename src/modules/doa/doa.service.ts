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
   */
  static async getMatrix(companyId: string, matrixId: string): Promise<ApprovalMatrix> {
    const result = await callFunction("doa.get_matrix", {
      company_id: companyId,
      matrix_id: matrixId,
    });
    return result as ApprovalMatrix;
  }

  /**
   * Create a new approval matrix
   */
  static async createMatrix(
    companyId: string,
    data: Omit<ApprovalMatrix, "_id" | "_rev" | "type" | "companyId" | "createdAt" | "updatedAt" | "createdBy">,
    userId: string
  ): Promise<ApprovalMatrix> {
    const result = await callFunction("doa.create_matrix", {
      company_id: companyId,
      name: data.name,
      document_type: data.documentType,
      approval_blocks: data.approvalBlocks,
      created_by: userId,
      description: data.description || null,
      min_amount: data.minAmount || null,
      max_amount: data.maxAmount || null,
      currency: data.currency || "USD",
      is_active: data.isActive !== false,
    });
    return result as ApprovalMatrix;
  }

  /**
   * Update an existing approval matrix
   */
  static async updateMatrix(
    companyId: string,
    matrixId: string,
    data: Partial<ApprovalMatrix>
  ): Promise<ApprovalMatrix> {
    const result = await callFunction("doa.update_matrix", {
      company_id: companyId,
      matrix_id: matrixId,
      name: data.name || null,
      description: data.description || null,
      approval_blocks: data.approvalBlocks || null,
      is_active: data.isActive !== undefined ? data.isActive : null,
      status: data.status || null,
      min_amount: data.minAmount !== undefined ? data.minAmount : null,
      max_amount: data.maxAmount !== undefined ? data.maxAmount : null,
    });
    return result as ApprovalMatrix;
  }

  /**
   * Delete an approval matrix
   */
  static async deleteMatrix(companyId: string, matrixId: string): Promise<void> {
    await callFunction("doa.delete_matrix", {
      company_id: companyId,
      matrix_id: matrixId,
    });
  }

  /**
   * Get active matrix for a document type
   */
  static async getActiveMatrixForType(companyId: string, documentType: string): Promise<ApprovalMatrix | null> {
    // Convert companyId (text) to UUID for this function
    // This function expects UUID, so we need to handle this differently
    // For now, we'll use the get_matrices and filter client-side
    const matrices = await this.getMatrices(companyId);
    const activeMatrix = matrices.find(
      (m) => m.documentType === documentType && m.status === "active" && m.isActive
    );
    return activeMatrix || null;
  }
}
