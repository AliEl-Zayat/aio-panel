/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CurrentOrgProvider,
  useCurrentOrg,
} from "@/contexts/current-org-context";

function Consumer({ onValue }: { onValue: (v: number | null) => void }) {
  const { currentOrganizationId, setCurrentOrganizationId } = useCurrentOrg();
  return (
    <div>
      <span data-testid="current">{currentOrganizationId ?? "null"}</span>
      <button
        type="button"
        onClick={() => {
          setCurrentOrganizationId(42);
          onValue(42);
        }}
      >
        Set 42
      </button>
      <button
        type="button"
        onClick={() => {
          setCurrentOrganizationId(null);
          onValue(null);
        }}
      >
        Set Personal
      </button>
    </div>
  );
}

describe("CurrentOrgContext", () => {
  beforeEach(() => {
    document.cookie = "";
  });

  it("provides null by default", () => {
    let value: number | null = undefined as unknown as number | null;
    render(
      <CurrentOrgProvider>
        <Consumer
          onValue={(v) => {
            value = v;
          }}
        />
      </CurrentOrgProvider>
    );
    expect(screen.getByTestId("current").textContent).toBe("null");
  });

  it("updates when setCurrentOrganizationId is called", () => {
    render(
      <CurrentOrgProvider>
        <Consumer onValue={() => {}} />
      </CurrentOrgProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /set 42/i }));
    expect(screen.getByTestId("current").textContent).toBe("42");
    fireEvent.click(screen.getByRole("button", { name: /set personal/i }));
    expect(screen.getByTestId("current").textContent).toBe("null");
  });

  it("useCurrentOrg returns defaultValue when outside provider", () => {
    function Orphan() {
      const { currentOrganizationId } = useCurrentOrg();
      return <span data-testid="orphan">{String(currentOrganizationId)}</span>;
    }
    render(<Orphan />);
    expect(screen.getByTestId("orphan").textContent).toBe("null");
  });

  it("persists selection to cookie when set to org id", () => {
    render(
      <CurrentOrgProvider>
        <Consumer onValue={() => {}} />
      </CurrentOrgProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /set 42/i }));
    expect(document.cookie).toMatch(/current_org_id=42/);
  });

  it("clears cookie when set to null", () => {
    render(
      <CurrentOrgProvider>
        <Consumer onValue={() => {}} />
      </CurrentOrgProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /set 42/i }));
    fireEvent.click(screen.getByRole("button", { name: /set personal/i }));
    expect(document.cookie).not.toMatch(/current_org_id=\d/);
  });
});
