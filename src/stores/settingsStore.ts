import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  sidebarCollapsed: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  toggleSidebar: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      soundEnabled: true,
      animationsEnabled: true,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
    }),
    { name: "second-chair-settings" },
  ),
);
