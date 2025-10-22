import React, { createContext, useContext, useState } from "react";

export interface Company {
  id: string;
  title: string;
  logo?: string;
}

interface CompanyContextType {
  activeCompany: Company | null;
  companies: Company[];
  setActiveCompany: (company: Company | null) => void;
  setCompanies: (companies: Company[]) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  return (
    <CompanyContext.Provider value={{ activeCompany, companies, setActiveCompany, setCompanies }}>
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
