import React, { createContext, useContext, useState } from "react";

interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface BreadcrumbContextType {
  extraCrumbs: BreadcrumbItem[];
  setExtraCrumbs: (crumbs: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [extraCrumbs, setExtraCrumbs] = useState<BreadcrumbItem[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ extraCrumbs, setExtraCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
