"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SegmentControl } from "@/components/ui/segment-control";
import { usePreferences } from "@/hooks/use-preferences";
import type {
  ThemeMode,
  PageLayout,
  NavbarBehavior,
  SidebarStyle,
  SidebarCollapseMode,
} from "@/types/preferences";
import { cn } from "@/lib/utils";
import { THEME_PRESETS, FONT_OPTIONS } from "@/lib/preferences-constants";

export function PreferencesSheet({
  open,
  onOpenChange,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const t = useTranslations("preferences");
  const {
    preferences,
    isLoading,
    patch,
    restoreDefaults,
    patchStatus,
  } = usePreferences();

  const themeModeOptions = [
    { value: "LIGHT" as ThemeMode, label: t("themeModeLight") },
    { value: "DARK" as ThemeMode, label: t("themeModeDark") },
    { value: "SYSTEM" as ThemeMode, label: t("themeModeSystem") },
  ];
  const pageLayoutOptions = [
    { value: "CENTERED" as PageLayout, label: t("pageLayoutCentered") },
    { value: "FULL_WIDTH" as PageLayout, label: t("pageLayoutFullWidth") },
  ];
  const navbarOptions = [
    { value: "STICKY" as NavbarBehavior, label: t("navbarSticky") },
    { value: "SCROLL" as NavbarBehavior, label: t("navbarScroll") },
  ];
  const sidebarStyleOptions = [
    { value: "INSET" as SidebarStyle, label: t("sidebarInset") },
    { value: "SIDEBAR" as SidebarStyle, label: t("sidebarSidebar") },
    { value: "FLOATING" as SidebarStyle, label: t("sidebarFloating") },
  ];
  const collapseModeOptions = [
    { value: "ICON" as SidebarCollapseMode, label: t("collapseIcon") },
    { value: "OFF_CANVAS" as SidebarCollapseMode, label: t("collapseOffCanvas") },
  ];

  if (isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <p className="mt-1 text-muted-foreground text-xs">{t("storageNote")}</p>
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("themePreset")}
            </label>
            <select
              value={preferences.themePreset}
              onChange={(e) => patch({ themePreset: e.target.value })}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
            >
              {THEME_PRESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("fonts")}</label>
            <select
              value={preferences.fontFamily}
              onChange={(e) => patch({ fontFamily: e.target.value })}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("themeMode")}
            </label>
            <SegmentControl
              value={preferences.themeMode}
              options={themeModeOptions}
              onValueChange={(v) => patch({ themeMode: v })}
              aria-label={t("themeMode")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("pageLayout")}
            </label>
            <SegmentControl
              value={preferences.pageLayout}
              options={pageLayoutOptions}
              onValueChange={(v) => patch({ pageLayout: v })}
              aria-label={t("pageLayout")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("navbarBehavior")}
            </label>
            <SegmentControl
              value={preferences.navbarBehavior}
              options={navbarOptions}
              onValueChange={(v) => patch({ navbarBehavior: v })}
              aria-label={t("navbarBehavior")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("sidebarStyle")}
            </label>
            <SegmentControl
              value={preferences.sidebarStyle}
              options={sidebarStyleOptions}
              onValueChange={(v) => patch({ sidebarStyle: v })}
              aria-label={t("sidebarStyle")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("sidebarCollapseMode")}
            </label>
            <SegmentControl
              value={preferences.sidebarCollapseMode}
              options={collapseModeOptions}
              onValueChange={(v) => patch({ sidebarCollapseMode: v })}
              aria-label={t("sidebarCollapseMode")}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("convertToLocaleCurrency")}</p>
              <p className="text-muted-foreground text-xs">
                {t("convertToLocaleCurrencyDescription")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.convertToLocaleCurrency}
              onClick={() =>
                patch({ convertToLocaleCurrency: !preferences.convertToLocaleCurrency })
              }
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-input transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                preferences.convertToLocaleCurrency ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                  preferences.convertToLocaleCurrency ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => restoreDefaults()}
            disabled={patchStatus === "pending"}
          >
            {t("restoreDefaults")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
