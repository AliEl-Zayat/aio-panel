import { describe, it, expect } from "vitest";
import { buildApiIssueMarkdown, type ApiReporterInputs } from "./api-reporter-template";

describe("buildApiIssueMarkdown", () => {
  it("includes endpoint and method in header", () => {
    const out = buildApiIssueMarkdown({
      endpoint: "/api/users/me",
      method: "GET",
      expected: "",
      actual: "200 OK",
    });
    expect(out).toContain("## API Issue");
    expect(out).toContain("**Endpoint:** `GET /api/users/me`");
    expect(out).toContain("**Environment:** N/A");
  });

  it("uses provided environment or N/A", () => {
    const withEnv = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "POST",
      expected: "",
      actual: "",
      environment: "Production",
    });
    expect(withEnv).toContain("**Environment:** Production");

    const emptyEnv = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "GET",
      expected: "",
      actual: "",
    });
    expect(emptyEnv).toContain("**Environment:** N/A");
  });

  it("includes request payload block when requestPayload present", () => {
    const out = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "POST",
      expected: "",
      actual: "",
      requestPayload: '{"id":1}',
      contentType: "JSON",
    });
    expect(out).toContain("### Request payload (JSON)");
    expect(out).toContain("```json");
    expect(out).toContain('{"id":1}');
  });

  it("omits request payload block when requestPayload empty", () => {
    const out = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "GET",
      expected: "",
      actual: "",
    });
    expect(out).not.toContain("### Request payload");
  });

  it("includes expected block when expected non-empty", () => {
    const out = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "GET",
      expected: "200 and body",
      actual: "500",
    });
    expect(out).toContain("### Expected");
    expect(out).toContain("200 and body");
  });

  it("omits expected block when expected empty", () => {
    const out = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "GET",
      expected: "",
      actual: "500",
    });
    expect(out).not.toContain("### Expected");
  });

  it("includes actual response block with actual or placeholder", () => {
    const withActual = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "GET",
      expected: "",
      actual: "500 Internal Server Error",
    });
    expect(withActual).toContain("### Actual (Response)");
    expect(withActual).toContain("500 Internal Server Error");

    const emptyActual = buildApiIssueMarkdown({
      endpoint: "/api",
      method: "GET",
      expected: "",
      actual: "",
    });
    expect(emptyActual).toContain("(not provided)");
  });
});
