"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

type UiState = {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  theme: Theme;
  rightPanelOpen: boolean;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleRightPanel: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandOpen: false,
      theme: "dark",
      rightPanelOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setTheme: (theme) => set({ theme }),
      toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen }))
    }),
    { name: "sprintmind-ui" }
  )
);

