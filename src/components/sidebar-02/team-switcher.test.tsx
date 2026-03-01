/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamSwitcher } from "./team-switcher";

const mockSetCurrentOrganizationId = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/contexts/current-org-context", () => ({
  useCurrentOrg: () => ({
    currentOrganizationId: null,
    setCurrentOrganizationId: mockSetCurrentOrganizationId,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (args: unknown) => {
    mockUseQuery(args);
    return {
      data: [
        { id: 1, name: "Org A", slug: "org-a", role: "ADMIN" },
        { id: 2, name: "Org B", slug: "org-b", role: "MEMBER" },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ isMobile: false }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => {
    const map: Record<string, string> = {
      personal: "Personal",
      organization: "Organization",
      personalAccount: "Personal account",
      switchContext: "Switch context",
      loadOrgsError: "Failed to load organizations",
      addOrganization: "Add organization",
    };
    return ns === "common" && key === "retry" ? "Retry" : map[key] ?? key;
  },
}));

describe("TeamSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trigger with Personal when currentOrganizationId is null", () => {
    render(<TeamSwitcher />);
    expect(screen.getByText("Personal")).toBeTruthy();
  });

  it("fetches organizations list for TeamSwitcher options", () => {
    render(<TeamSwitcher />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["organizations"],
      })
    );
  });

  it("renders Personal account subtitle when personal context", () => {
    render(<TeamSwitcher />);
    expect(screen.getByText("Personal account")).toBeTruthy();
  });
});
