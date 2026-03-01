"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { secretKeyService } from "@/services/secret-key.service";
import type {
  SecretKey,
  SecretKeyKind,
  OrganizationMembership,
  Project,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;
const HINT_MAX_LENGTH = 500;

function getScopeFromKey(
  key: SecretKey | null | undefined
): "personal" | "org" | "project" {
  if (key?.organizationId != null) return "org";
  if (key?.projectId != null) return "project";
  return "personal";
}

export interface SecretKeyFormProps {
  readonly initial?: SecretKey | null;
  readonly organizations: OrganizationMembership[];
  readonly projects: Project[];
  readonly onSuccess: (key: SecretKey) => void;
  readonly onCancel?: () => void;
}

export function SecretKeyForm({
  initial,
  organizations,
  projects,
  onSuccess,
  onCancel,
}: SecretKeyFormProps) {
  const t = useTranslations("secretKeys");
  const tCommon = useTranslations("common");
  const isEdit = initial != null;

  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<SecretKeyKind>(initial?.kind ?? "API_KEY");
  const [scope, setScope] = useState<"personal" | "org" | "project">(
    getScopeFromKey(initial)
  );
  const [organizationId, setOrganizationId] = useState<number | null>(
    initial?.organizationId ?? null
  );
  const [projectId, setProjectId] = useState<number | null>(
    initial?.projectId ?? null
  );
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [value, setValue] = useState("");
  const [updateValue, setUpdateValue] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initial == null) return;
    setName(initial.name);
    setKind(initial.kind);
    setScope(getScopeFromKey(initial));
    setOrganizationId(initial.organizationId ?? null);
    setProjectId(initial.projectId ?? null);
    setHint(initial.hint ?? "");
  }, [initial]);

  const projectsForSelectedOrg = useMemo(() => {
    if (organizationId == null) return projects;
    return projects.filter((p) => p.organizationId === organizationId);
  }, [projects, organizationId]);

  const getSubmitErrorMessage = (err: unknown): string => {
    if (err instanceof AxiosError && err.response?.data?.error) {
      return String(err.response.data.error);
    }
    return isEdit ? t("updateError") : t("createError");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();

    setNameError(null);
    setValueError(null);
    setSubmitError(null);

    if (trimmedName.length === 0) {
      setNameError(tCommon("nameRequired"));
      return;
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      setNameError(tCommon("nameMaxLength", { max: NAME_MAX_LENGTH }));
      return;
    }
    if (!isEdit && value.trim().length === 0) {
      setValueError(t("valueRequired"));
      return;
    }
    if (isEdit && updateValue && value.trim().length === 0) {
      setValueError(t("valueRequired"));
      return;
    }
    if (hint.length > HINT_MAX_LENGTH) {
      setValueError(null);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && initial) {
        const body: Parameters<typeof secretKeyService.update>[1] = {
          name: trimmedName,
          kind,
          hint: hint.trim() || null,
        };
        if (updateValue && value.trim().length > 0) {
          body.value = value.trim();
        }
        const updated = await secretKeyService.update(initial.id, body);
        onSuccess(updated);
        return;
      }
      const orgId = scope === "org" ? organizationId ?? undefined : undefined;
      const projId =
        scope === "project" ? projectId ?? undefined : undefined;
      const created = await secretKeyService.create({
        name: trimmedName,
        kind,
        value: value.trim(),
        hint: hint.trim() || undefined,
        organizationId: orgId ?? null,
        projectId: projId ?? null,
      });
      onSuccess(created);
    } catch (err) {
      setSubmitError(getSubmitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="secret-key-name">{t("name")}</Label>
        <Input
          id="secret-key-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          maxLength={NAME_MAX_LENGTH}
          aria-invalid={!!nameError}
        />
        {nameError && (
          <p className="text-sm text-destructive" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("kind")}</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="secret-key-kind"
              checked={kind === "API_KEY"}
              onChange={() => setKind("API_KEY")}
            />
            {t("kindApiKey")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="secret-key-kind"
              checked={kind === "ENCRYPTION_KEY"}
              onChange={() => setKind("ENCRYPTION_KEY")}
            />
            {t("kindEncryptionKey")}
          </label>
        </div>
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label>{t("scope")}</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                checked={scope === "personal"}
                onChange={() => {
                  setScope("personal");
                  setOrganizationId(null);
                  setProjectId(null);
                }}
              />
              {t("scopePersonal")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                checked={scope === "org"}
                onChange={() => {
                  setScope("org");
                  setProjectId(null);
                  setOrganizationId(organizations[0]?.id ?? null);
                }}
              />
              {t("scopeOrg")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                checked={scope === "project"}
                onChange={() => {
                  setScope("project");
                  setOrganizationId(organizations[0]?.id ?? null);
                  setProjectId(
                    projectsForSelectedOrg[0]?.id ?? null
                  );
                }}
              />
              {t("scopeProject")}
            </label>
          </div>
          {scope === "org" && organizations.length > 0 && (
            <select
              className="mt-2 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={organizationId ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                setOrganizationId(id);
                setProjectId(null);
              }}
              aria-label={t("scopeOrg")}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}
          {scope === "project" && projectsForSelectedOrg.length > 0 && (
            <select
              className="mt-2 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={projectId ?? ""}
              onChange={(e) =>
                setProjectId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              aria-label={t("scopeProject")}
            >
              {projectsForSelectedOrg.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="secret-key-hint">{t("hint")}</Label>
        <Input
          id="secret-key-hint"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder={t("hint")}
          maxLength={HINT_MAX_LENGTH}
        />
      </div>

      {isEdit ? (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={updateValue}
              onChange={(e) => setUpdateValue(e.target.checked)}
            />
            {t("updateValue")}
          </label>
          {updateValue && (
            <>
              <Input
                type="password"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t("value")}
                aria-invalid={!!valueError}
              />
              {valueError && (
                <p className="text-sm text-destructive" role="alert">
                  {valueError}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="secret-key-value">{t("value")}</Label>
          <Input
            id="secret-key-value"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("value")}
            aria-invalid={!!valueError}
          />
          {valueError && (
            <p className="text-sm text-destructive" role="alert">
              {valueError}
            </p>
          )}
        </div>
      )}

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
