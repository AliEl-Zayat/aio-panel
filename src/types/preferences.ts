export type ThemeMode = "LIGHT" | "DARK" | "SYSTEM";
export type PageLayout = "CENTERED" | "FULL_WIDTH";
export type NavbarBehavior = "STICKY" | "SCROLL";
export type SidebarStyle = "INSET" | "SIDEBAR" | "FLOATING";
export type SidebarCollapseMode = "ICON" | "OFF_CANVAS";

export interface UserPreferences {
  themePreset: string;
  fontFamily: string;
  themeMode: ThemeMode;
  pageLayout: PageLayout;
  navbarBehavior: NavbarBehavior;
  sidebarStyle: SidebarStyle;
  sidebarCollapseMode: SidebarCollapseMode;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  themePreset: "default",
  fontFamily: "Inter",
  themeMode: "SYSTEM",
  pageLayout: "CENTERED",
  navbarBehavior: "STICKY",
  sidebarStyle: "INSET",
  sidebarCollapseMode: "ICON",
};

export type PatchPreferences = Partial<UserPreferences>;
/** Alias for PATCH body (partial preferences). */
export type PatchPreferencesBody = PatchPreferences;
