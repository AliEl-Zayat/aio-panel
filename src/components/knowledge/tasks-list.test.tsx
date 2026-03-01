/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TasksList } from "./tasks-list";

const mockSetView = vi.fn();
const mockSetDensity = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("./use-knowledge-view-preferences", () => ({
  useKnowledgeViewPreferences: () => ({
    view: "table",
    setView: mockSetView,
    density: "expanded",
    setDensity: mockSetDensity,
  }),
}));

vi.mock("@/services/knowledge-task.service", () => ({
  knowledgeTaskService: {
    list: vi.fn().mockResolvedValue([]),
    reorder: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/company.service", () => ({
  companyService: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/services/organization.service", () => ({
  organizationService: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/services/project.service", () => ({
  projectService: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: (opts: { queryKey: unknown[]; queryFn?: () => Promise<unknown> }) => {
      const key = opts.queryKey[0];
      const data = key === "knowledge-tasks" ? [] : [];
      return {
        data,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("TasksList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows view mode toggle (Table and Cards)", () => {
    render(<TasksList />, { wrapper: createWrapper() });
    expect(screen.getByRole("radio", { name: "viewTable" })).toBeDefined();
    expect(screen.getByRole("radio", { name: "viewCards" })).toBeDefined();
  });

  it("shows density toggle (Compact and Expanded)", () => {
    render(<TasksList />, { wrapper: createWrapper() });
    expect(screen.getByText("densityCompact")).toBeDefined();
    expect(screen.getByText("densityExpanded")).toBeDefined();
  });

  it("shows empty state when no tasks", () => {
    render(<TasksList />, { wrapper: createWrapper() });
    expect(screen.getByText("noTasksYet")).toBeDefined();
  });
});
