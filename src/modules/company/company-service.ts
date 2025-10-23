/**
 * Company Service - Business logic for managing companies
 *
 * Handles CRUD operations for companies and user-company relationships
 * Works directly with PouchDB/CouchDB (no backend API needed)
 */

import {
  companiesDB,
  userCompaniesDB,
  type Company,
  type UserCompany
} from "@/modules/shared/database/db";
import type { CreateCompanyInput, UpdateCompanyInput } from "./company.valibot";

export class CompanyService {
  /**
   * Create a new company
   * For workspace companies, automatically creates user_company association
   */
  static async createCompany(
    userId: string,
    data: CreateCompanyInput
  ): Promise<Company> {
    const now = Date.now();
    const companyId = `company_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const company: Company = {
      _id: companyId,
      type: data.type,
      title: data.title,
      logo: data.logo,
      website: data.website,
      businessId: data.businessId,
      taxId: data.taxId,
      residence: data.residence,
      industry: data.industry,
      contact: data.contact,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Save company to database
      const result = await companiesDB.put(company);
      company._rev = result.rev;

      // For workspace companies, create user_company association
      if (data.type === "workspace") {
        const userCompany: UserCompany = {
          _id: `uc_${userId}_${companyId}`,
          type: "user_company",
          userId,
          companyId,
          role: "owner",
          createdAt: now,
        };

        await userCompaniesDB.put(userCompany);
      }

      return this.sanitizeCompany(company);
    } catch (error) {
      console.error("Failed to create company:", error);
      throw new Error("Failed to create company");
    }
  }

  /**
   * Get all companies for a user (only workspace type)
   */
  static async getUserCompanies(userId: string): Promise<Company[]> {
    try {
      // Find all user_company associations for this user
      const userCompaniesResult = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
        },
      });

      if (userCompaniesResult.docs.length === 0) {
        return [];
      }

      // Get all company IDs
      const companyIds = userCompaniesResult.docs.map(
        (uc: any) => uc.companyId
      );

      // Fetch all companies
      const companies: Company[] = [];
      for (const companyId of companyIds) {
        try {
          const company = await companiesDB.get(companyId);
          companies.push(this.sanitizeCompany(company as Company));
        } catch (error) {
          console.warn(`Company ${companyId} not found, skipping`);
        }
      }

      return companies;
    } catch (error) {
      console.error("Failed to get user companies:", error);
      throw new Error("Failed to get user companies");
    }
  }

  /**
   * Get company by ID
   */
  static async getCompanyById(companyId: string): Promise<Company> {
    try {
      const company = await companiesDB.get(companyId);
      return this.sanitizeCompany(company as Company);
    } catch (error) {
      console.error("Failed to get company:", error);
      throw new Error("Company not found");
    }
  }

  /**
   * Update company
   */
  static async updateCompany(
    companyId: string,
    data: UpdateCompanyInput
  ): Promise<Company> {
    try {
      const company = (await companiesDB.get(companyId)) as Company;

      const updatedCompany: Company = {
        ...company,
        title: data.title ?? company.title,
        logo: data.logo ?? company.logo,
        website: data.website ?? company.website,
        businessId: data.businessId ?? company.businessId,
        taxId: data.taxId ?? company.taxId,
        residence: data.residence ?? company.residence,
        industry: data.industry ?? company.industry,
        contact: data.contact ?? company.contact,
        settings: data.settings ?? company.settings,
        updatedAt: Date.now(),
      };

      const result = await companiesDB.put(updatedCompany);
      updatedCompany._rev = result.rev;

      return this.sanitizeCompany(updatedCompany);
    } catch (error) {
      console.error("Failed to update company:", error);
      throw new Error("Failed to update company");
    }
  }

  /**
   * Delete company (soft delete - mark as inactive)
   * Also removes user_company associations
   */
  static async deleteCompany(companyId: string): Promise<void> {
    try {
      // Find all user_company associations for this company
      const userCompaniesResult = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          companyId: companyId,
        },
      });

      // Delete all user_company associations
      for (const userCompany of userCompaniesResult.docs) {
        await userCompaniesDB.remove(userCompany._id, userCompany._rev!);
      }

      // Delete the company itself
      const company = await companiesDB.get(companyId);
      await companiesDB.remove(company._id, company._rev!);
    } catch (error) {
      console.error("Failed to delete company:", error);
      throw new Error("Failed to delete company");
    }
  }

  /**
   * Check if user has access to company
   */
  static async hasAccess(userId: string, companyId: string): Promise<boolean> {
    try {
      const result = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
          companyId: companyId,
        },
        limit: 1,
      });

      return result.docs.length > 0;
    } catch (error) {
      console.error("Failed to check company access:", error);
      return false;
    }
  }

  /**
   * Get user role in company
   */
  static async getUserRole(
    userId: string,
    companyId: string
  ): Promise<"owner" | "admin" | "member" | null> {
    try {
      const result = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
          companyId: companyId,
        },
        limit: 1,
      });

      if (result.docs.length === 0) {
        return null;
      }

      return (result.docs[0] as UserCompany).role;
    } catch (error) {
      console.error("Failed to get user role:", error);
      return null;
    }
  }

  /**
   * Sanitize company data (remove sensitive fields)
   */
  private static sanitizeCompany(company: Company): Company {
    // Currently no sensitive fields to remove
    // This method is here for future use (e.g., API keys, secrets)
    return company;
  }
}
