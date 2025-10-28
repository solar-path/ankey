/**
 * Company Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (company.sql)
 * This service just calls Hono API which executes SQL functions
 */

import type { CreateCompanyInput, UpdateCompanyInput } from "./company.valibot";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Helper function to call Postgres functions via Hono API
 */
async function callFunction(functionName: string, params: Record<string, any> = {}) {
  const response = await fetch(`${API_URL}/api/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to call ${functionName}`);
  }

  return response.json();
}

export class CompanyService {
  /**
   * Create a new company
   */
  static async createCompany(userId: string, data: CreateCompanyInput) {
    return callFunction("company.create_company", {
      user_id: userId,
      type: data.type,
      title: data.title,
      logo: data.logo,
      website: data.website,
      business_id: data.businessId,
      tax_id: data.taxId,
      residence: data.residence,
      industry: data.industry,
      contact: data.contact ? JSON.stringify(data.contact) : null,
    });
  }

  /**
   * Get all companies for a user
   */
  static async getUserCompanies(userId: string) {
    return callFunction("company.get_user_companies", { user_id: userId });
  }

  /**
   * Get company by ID
   */
  static async getCompanyById(companyId: string) {
    return callFunction("company.get_company_by_id", { company_id: companyId });
  }

  /**
   * Update company
   */
  static async updateCompany(companyId: string, data: UpdateCompanyInput) {
    return callFunction("company.update_company", {
      company_id: companyId,
      title: data.title,
      logo: data.logo,
      website: data.website,
      business_id: data.businessId,
      tax_id: data.taxId,
      residence: data.residence,
      industry: data.industry,
      contact: data.contact ? JSON.stringify(data.contact) : null,
      settings: data.settings ? JSON.stringify(data.settings) : null,
    });
  }

  /**
   * Delete company
   */
  static async deleteCompany(companyId: string) {
    return callFunction("company.delete_company", { company_id: companyId });
  }

  /**
   * Check if user has access to company
   */
  static async hasAccess(userId: string, companyId: string): Promise<boolean> {
    const result = await callFunction("company.has_access", {
      user_id: userId,
      company_id: companyId,
    });
    return result.hasAccess;
  }

  /**
   * Get user role in company
   */
  static async getUserRole(userId: string, companyId: string): Promise<string | null> {
    const result = await callFunction("company.get_user_role", {
      user_id: userId,
      company_id: companyId,
    });
    return result.role;
  }
}
