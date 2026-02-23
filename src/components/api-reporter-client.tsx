"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildApiIssueMarkdown } from "@/lib/api-reporter-template";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const ENVIRONMENTS = ["", "Dev", "QC", "Production"] as const;
const NON_JSON_CONTENT_TYPES = ["Text", "XML", "HTML"] as const;

export function ApiReporterClient() {
  const t = useTranslations("apiReporter");
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState<(typeof HTTP_METHODS)[number]>("GET");
  const [environment, setEnvironment] = useState("");
  const [requestPayload, setRequestPayload] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [isJson, setIsJson] = useState(true);
  const [nonJsonType, setNonJsonType] = useState<(typeof NON_JSON_CONTENT_TYPES)[number]>("Text");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  const markdown = buildApiIssueMarkdown({
    endpoint,
    method,
    expected,
    actual,
    environment: environment || undefined,
    requestPayload: requestPayload.trim() ? requestPayload : undefined,
    contentType: isJson ? undefined : nonJsonType,
  });

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  }, [markdown]);

  const canCopy = endpoint.trim().length > 0 && method.length > 0;

  const githubIssuesUrl = process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL;
  const openInGitHubUrl =
    githubIssuesUrl ?
      `${githubIssuesUrl}${githubIssuesUrl.includes("?") ? "&" : "?"}body=${encodeURIComponent(markdown)}`
    : null;

  let copyButtonLabel = t("copyMarkdown");
  if (copyStatus === "success") copyButtonLabel = t("copied");
  else if (copyStatus === "error") copyButtonLabel = t("copyError");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="endpoint">{t("endpoint")}</Label>
          <Input
            id="endpoint"
            placeholder="e.g. GET /api/users/me or https://api.example.com/v1/users"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="method">{t("method")}</Label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as (typeof HTTP_METHODS)[number])}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="environment">{t("environment")}</Label>
          <select
            id="environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env || "empty"} value={env}>
                {env || t("environmentPlaceholder")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isJson}
                onChange={(e) => setIsJson(e.target.checked)}
                className="rounded border-input"
              />
              {t("contentIsJson")}
            </label>
            {!isJson && (
              <select
                value={nonJsonType}
                onChange={(e) => setNonJsonType(e.target.value as (typeof NON_JSON_CONTENT_TYPES)[number])}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={t("contentType")}
              >
                {NON_JSON_CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="requestPayload">{t("requestPayload")}</Label>
          <textarea
            id="requestPayload"
            placeholder={isJson ? "Request body (JSON)" : t("requestPayloadPlaceholder")}
            value={requestPayload}
            onChange={(e) => setRequestPayload(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px] font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected">{t("expectedOptional")}</Label>
          <textarea
            id="expected"
            placeholder={t("expectedPlaceholder")}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actual">{t("actualResponse")}</Label>
          <textarea
            id="actual"
            placeholder={t("actualPlaceholder")}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] font-mono"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopy} disabled={!canCopy}>
            {copyButtonLabel}
          </Button>
          {openInGitHubUrl && (
            <Button variant="outline" asChild>
              <a href={openInGitHubUrl} target="_blank" rel="noopener noreferrer">
                {t("openInGitHub")}
              </a>
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("preview")}</Label>
        <pre className="rounded-md border bg-muted p-4 text-sm overflow-auto max-h-[400px] whitespace-pre-wrap break-words">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
