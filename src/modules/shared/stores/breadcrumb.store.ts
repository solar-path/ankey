import { create } from "zustand";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbState {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>()((set) => ({
  breadcrumbs: [],

  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  addBreadcrumb: (breadcrumb) =>
    set((state) => ({
      breadcrumbs: [...state.breadcrumbs, breadcrumb],
    })),

  clearBreadcrumbs: () => set({ breadcrumbs: [] }),
}));
