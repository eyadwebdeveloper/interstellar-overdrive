import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TextSize = "standard" | "large" | "xl";
export const TEXT_SCALE: Record<TextSize, string> = { standard: "100%", large: "112.5%", xl: "125%" };

interface SettingsState {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
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
      textSize: "standard" as TextSize,
      setTextSize: (textSize) => set({ textSize }),
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
