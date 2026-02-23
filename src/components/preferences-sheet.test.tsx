/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { PreferencesSheet } from "./preferences-sheet";
import { DEFAULT_PREFERENCES } from "@/types/preferences";

const mockPatch = vi.fn();
const mockRestoreDefaults = vi.fn();

vi.mock("@/hooks/use-preferences", () => ({
  usePreferences: () => ({
    preferences: { ...DEFAULT_PREFERENCES },
    isLoading: false,
    patch: mockPatch,
    restoreDefaults: mockRestoreDefaults,
    patchStatus: "idle",
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/i18n/routing", () => ({
  isRtl: () => false,
}));

describe("PreferencesSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls patch when theme mode is changed", async () => {
    render(
      <PreferencesSheet open={true} onOpenChange={() => {}} />
    );

    const themeModeGroup = screen.getByRole("group", { name: "themeMode" });
    const darkOption = within(themeModeGroup).getByRole("radio", {
      name: "themeModeDark",
    });
    fireEvent.click(darkOption);

    expect(mockPatch).toHaveBeenCalledWith({ themeMode: "DARK" });
  });

  it("calls restoreDefaults when Restore defaults is clicked, and sends full default via patch", async () => {
    mockRestoreDefaults.mockImplementation(() => {
      mockPatch(DEFAULT_PREFERENCES);
    });

    render(
      <PreferencesSheet open={true} onOpenChange={() => {}} />
    );

    const restoreButton = screen.getByRole("button", {
      name: "restoreDefaults",
    });
    fireEvent.click(restoreButton);

    expect(mockRestoreDefaults).toHaveBeenCalled();
    expect(mockPatch).toHaveBeenCalledWith(DEFAULT_PREFERENCES);
  });
});
