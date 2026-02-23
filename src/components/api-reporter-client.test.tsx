/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ApiReporterClient } from "./api-reporter-client";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ApiReporterClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form and preview with endpoint and method", () => {
    render(<ApiReporterClient />);

    const endpointInput = screen.getByLabelText(/endpoint/i);
    const methodSelect = screen.getByLabelText(/method/i);

    fireEvent.change(endpointInput, { target: { value: "/api/users/me" } });
    fireEvent.change(methodSelect, { target: { value: "POST" } });

    const preview = screen.getByText(/## API Issue/);
    expect(preview).toBeDefined();
    expect(preview.textContent).toContain("/api/users/me");
    expect(preview.textContent).toContain("**Endpoint:** `POST /api/users/me`");
  });

  it("calls clipboard.writeText with markdown when Copy clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ApiReporterClient />);

    const endpointInput = screen.getByLabelText(/endpoint/i);
    fireEvent.change(endpointInput, { target: { value: "/api/health" } });

    const copyButton = screen.getByRole("button", { name: /copyMarkdown/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    const markdown = writeText.mock.calls[0][0];
    expect(markdown).toContain("## API Issue");
    expect(markdown).toContain("/api/health");
    expect(markdown).toContain("GET");
  });

  it("disables Copy when endpoint is empty", () => {
    render(<ApiReporterClient />);
    const copyButton = screen.getByRole("button", { name: /copyMarkdown/i });
    expect((copyButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables Copy when endpoint and method are set", () => {
    render(<ApiReporterClient />);
    const endpointInput = screen.getByLabelText(/endpoint/i);
    fireEvent.change(endpointInput, { target: { value: "/api" } });
    const copyButton = screen.getByRole("button", { name: /copyMarkdown/i });
    expect((copyButton as HTMLButtonElement).disabled).toBe(false);
  });
});
