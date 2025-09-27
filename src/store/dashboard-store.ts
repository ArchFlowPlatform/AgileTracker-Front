import { create } from 'zustand';

export type DashboardPage = 'home' | 'burndown' | 'kanban' | 'analytics' | 'settings';

interface DashboardState {
  currentPage: DashboardPage;
  sidebarOpen: boolean;
  setCurrentPage: (page: DashboardPage) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentPage: 'home',
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
