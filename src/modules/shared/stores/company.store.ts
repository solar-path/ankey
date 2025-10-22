import { create } from "zustand";

export interface Company {
  id: string;
  name: string;
  logo?: string;
}

interface CompanyState {
  activeCompany: Company | null;
  companies: Company[];

  setActiveCompany: (company: Company | null) => void;
  setCompanies: (companies: Company[]) => void;
}

export const useCompanyStore = create<CompanyState>()((set) => ({
  activeCompany: null,
  companies: [],

  setActiveCompany: (company) => set({ activeCompany: company }),
  setCompanies: (companies) => set({ companies }),
}));
