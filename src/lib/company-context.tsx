import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CompanyService } from "@/modules/company/company-service";
import { CompanyDatabaseFactory } from "@/modules/shared/database/company-db-factory";
import type { Company as DBCompany } from "@/modules/shared/database/db";

export interface Company {
  id: string;
  title: string;
  logo?: string;
}

interface CompanyContextType {
  activeCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  setActiveCompany: (company: Company | null) => void;
  setCompanies: (companies: Company[]) => void;
  reloadCompanies: (newCompanyId?: string) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY_ACTIVE_COMPANY = "ankey_active_company_id";

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Convert DB Company to UI Company
   */
  const convertCompany = (dbCompany: DBCompany): Company => ({
    id: dbCompany._id,
    title: dbCompany.title,
    logo: dbCompany.logo,
  });

  /**
   * Switch to a different company (internal with company list parameter)
   */
  const switchCompanyInternal = async (companyId: string, companiesList: Company[]) => {
    try {
      console.log(`[CompanyProvider] Switching to company: ${companyId}`);

      // Find company in list
      const company = companiesList.find((c) => c.id === companyId);
      if (!company) {
        throw new Error(`Company ${companyId} not found in list`);
      }

      // Connect to company databases
      await CompanyDatabaseFactory.connectToCompany(companyId);

      // Update state
      setActiveCompanyState(company);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_ACTIVE_COMPANY, companyId);

      console.log(`[CompanyProvider] Switched to company: ${company.title}`);
    } catch (error) {
      console.error("[CompanyProvider] Failed to switch company:", error);
      throw error;
    }
  };

  /**
   * Load companies for current user
   */
  const reloadCompanies = useCallback(async (newCompanyId?: string) => {
    try {
      setIsLoading(true);

      // Get user ID from localStorage (set by AuthProvider)
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        console.log("[CompanyProvider] No session token, skipping company load");
        setCompanies([]);
        setActiveCompanyState(null);
        return;
      }

      // Get user from session (simplified - in real app, decode JWT or fetch from DB)
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.log("[CompanyProvider] No userId in localStorage");
        setCompanies([]);
        setActiveCompanyState(null);
        return;
      }

      // Load companies from database
      const dbCompanies = await CompanyService.getUserCompanies(userId);
      const uiCompanies = dbCompanies.map(convertCompany);

      console.log(`[CompanyProvider] Loaded ${uiCompanies.length} companies`);
      setCompanies(uiCompanies);

      // Determine active company
      let companyToActivate: Company | null = null;

      if (newCompanyId) {
        // New company created - activate it
        companyToActivate = uiCompanies.find((c) => c.id === newCompanyId) || null;
        console.log("[CompanyProvider] Activating new company:", companyToActivate?.title);
      } else {
        // Try to restore from localStorage
        const savedCompanyId = localStorage.getItem(STORAGE_KEY_ACTIVE_COMPANY);
        if (savedCompanyId) {
          companyToActivate = uiCompanies.find((c) => c.id === savedCompanyId) || null;
          console.log("[CompanyProvider] Restored company from localStorage:", companyToActivate?.title);
        }

        // If not found in localStorage, activate first company
        if (!companyToActivate && uiCompanies.length > 0) {
          companyToActivate = uiCompanies[0];
          console.log("[CompanyProvider] Activating first company:", companyToActivate.title);
        }
      }

      if (companyToActivate) {
        await switchCompanyInternal(companyToActivate.id, uiCompanies);
      } else {
        setActiveCompanyState(null);
        await CompanyDatabaseFactory.disconnectFromCompany();
      }
    } catch (error) {
      console.error("[CompanyProvider] Failed to reload companies:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Switch to a different company (public API)
   */
  const switchCompany = useCallback(async (companyId: string) => {
    await switchCompanyInternal(companyId, companies);
  }, [companies]);

  /**
   * Initialize companies on mount
   */
  useEffect(() => {
    reloadCompanies();
  }, []);

  const setActiveCompany = useCallback((company: Company | null) => {
    if (company) {
      switchCompany(company.id);
    } else {
      setActiveCompanyState(null);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_COMPANY);
      CompanyDatabaseFactory.disconnectFromCompany();
    }
  }, [switchCompany]);

  return (
    <CompanyContext.Provider value={{
      activeCompany,
      companies,
      isLoading,
      setActiveCompany,
      setCompanies,
      reloadCompanies,
      switchCompany
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

export function useCompanyOptional() {
  return useContext(CompanyContext);
}
