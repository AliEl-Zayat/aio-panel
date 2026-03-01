"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { emailTemplateService } from "@/services/email-template.service";
import { extractPlaceholderKeys, replacePlaceholders } from "@/lib/placeholder-utils";
import { RenderedEmailBody } from "@/lib/email-body-render";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const TEMPLATE_QUERY_KEY = ["email-template"] as const;

export interface ComposeViewProps {
  readonly templateId: number;
}

export function ComposeView({ templateId }: ComposeViewProps) {
  const t = useTranslations("emailTemplates");

  const { data: template, isLoading, error } = useQuery({
    queryKey: [...TEMPLATE_QUERY_KEY, templateId],
    queryFn: () => emailTemplateService.getById(templateId),
  });

  const placeholderKeys = useMemo(() => {
    if (!template) return [];
    const fromSubject = extractPlaceholderKeys(template.subject);
    const fromBody = extractPlaceholderKeys(template.body);
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const k of [...fromSubject, ...fromBody]) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
    return keys;
  }, [template]);

  const [values, setValues] = useState<Record<string, string>>({});

  const finalSubject = useMemo(
    () => (template ? replacePlaceholders(template.subject, values) : ""),
    [template, values]
  );
  const finalBody = useMemo(
    () => (template ? replacePlaceholders(template.body, values) : ""),
    [template, values]
  );

  const setKey = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    const text = `Subject: ${finalSubject}\n\nBody:\n${finalBody}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  }, [finalSubject, finalBody]);

  const handleMailto = useCallback(() => {
    const url = `mailto:?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [finalSubject, finalBody]);

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (isLoading || !template) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t("loadError")}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/email-templates">{t("backToList")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t("subjectPreview")}</Label>
        <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{finalSubject || "—"}</p>
      </div>
      <div className="space-y-2">
        <Label>{t("bodyPreview")}</Label>
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          {template.body.trim() ? (
            <RenderedEmailBody
              body={template.body}
              placeholderValues={values}
              className="min-h-[2rem]"
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {placeholderKeys.length > 0 && (
        <div className="space-y-4">
          <Label>{t("fillPlaceholders")}</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {placeholderKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`ph-${key}`}>{key}</Label>
                <Input
                  id={`ph-${key}`}
                  value={values[key] ?? ""}
                  onChange={(e) => setKey(key, e.target.value)}
                  placeholder={`{{${key}}}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCopy}>
          {copyFeedback ? t("copied") : t("copy")}
        </Button>
        <Button variant="outline" onClick={handleMailto}>
          {t("mailto")}
        </Button>
        {copyError && (
          <span className="text-sm text-destructive">{t("copyError")}</span>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        <Link href="/dashboard/email-templates" className="underline">
          ← {t("backToList")}
        </Link>
      </p>
    </div>
  );
}
