"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { secretAccountService } from "@/services/secret-account.service";
import type {
  SecretAccount,
  OrganizationMembership,
  Project,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;
const SERVICE_MAX_LENGTH = 100;
const USERNAME_MAX_LENGTH = 500;

function getScopeFromAccount(
  account: SecretAccount | null | undefined
): "personal" | "org" | "project" {
  if (account?.organizationId != null) return "org";
  if (account?.projectId != null) return "project";
  return "personal";
}

export interface SecretAccountFormProps {
  readonly initial?: SecretAccount | null;
  readonly organizations: OrganizationMembership[];
  readonly projects: Project[];
  readonly onSuccess: (account: SecretAccount) => void;
  readonly onCancel?: () => void;
}

export function SecretAccountForm({
  initial,
  organizations,
  projects,
  onSuccess,
  onCancel,
}: SecretAccountFormProps) {
  const t = useTranslations("secretAccounts");
  const tCommon = useTranslations("common");
  const isEdit = initial != null;

  const [name, setName] = useState(initial?.name ?? "");
  const [service, setService] = useState(initial?.service ?? "");
  const [loginUrl, setLoginUrl] = useState(initial?.loginUrl ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [updatePassword, setUpdatePassword] = useState(false);
  const [scope, setScope] = useState<"personal" | "org" | "project">(
    getScopeFromAccount(initial)
  );
  const [organizationId, setOrganizationId] = useState<number | null>(
    initial?.organizationId ?? null
  );
  const [projectId, setProjectId] = useState<number | null>(
    initial?.projectId ?? null
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initial == null) return;
    setName(initial.name);
    setService(initial.service ?? "");
    setLoginUrl(initial.loginUrl ?? "");
    setUsername(initial.username);
    setScope(getScopeFromAccount(initial));
    setOrganizationId(initial.organizationId ?? null);
    setProjectId(initial.projectId ?? null);
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
    const trimmedUsername = username.trim();

    setNameError(null);
    setUsernameError(null);
    setPasswordError(null);
    setSubmitError(null);

    if (trimmedName.length === 0) {
      setNameError(tCommon("nameRequired"));
      return;
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      setNameError(tCommon("nameMaxLength", { max: NAME_MAX_LENGTH }));
      return;
    }
    if (trimmedUsername.length === 0) {
      setUsernameError(t("usernameRequired"));
      return;
    }
    if (trimmedUsername.length > USERNAME_MAX_LENGTH) return;
    if (!isEdit && password.trim().length === 0) {
      setPasswordError(t("valueRequired"));
      return;
    }
    if (isEdit && updatePassword && password.trim().length === 0) {
      setPasswordError(t("valueRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && initial) {
        const body: Parameters<typeof secretAccountService.update>[1] = {
          name: trimmedName,
          service: service.trim() || null,
          loginUrl: loginUrl.trim() || null,
          username: trimmedUsername,
        };
        if (updatePassword && password.trim().length > 0) {
          body.password = password.trim();
        }
        const updated = await secretAccountService.update(initial.id, body);
        onSuccess(updated);
        return;
      }
      const orgId = scope === "org" ? organizationId ?? undefined : undefined;
      const projId =
        scope === "project" ? projectId ?? undefined : undefined;
      const created = await secretAccountService.create({
        name: trimmedName,
        service: service.trim() || undefined,
        loginUrl: loginUrl.trim() || undefined,
        username: trimmedUsername,
        password: password.trim(),
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
        <Label htmlFor="secret-account-name">{t("name")}</Label>
        <Input
          id="secret-account-name"
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
        <Label htmlFor="secret-account-service">{t("service")}</Label>
        <Input
          id="secret-account-service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder={t("service")}
          maxLength={SERVICE_MAX_LENGTH}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="secret-account-loginUrl">{t("loginUrl")}</Label>
        <Input
          id="secret-account-loginUrl"
          type="url"
          value={loginUrl}
          onChange={(e) => setLoginUrl(e.target.value)}
          placeholder="https://..."
          aria-invalid={false}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="secret-account-username">{t("username")}</Label>
        <Input
          id="secret-account-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("username")}
          maxLength={USERNAME_MAX_LENGTH}
          aria-invalid={!!usernameError}
        />
        {usernameError && (
          <p className="text-sm text-destructive" role="alert">
            {usernameError}
          </p>
        )}
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
                  setProjectId(projectsForSelectedOrg[0]?.id ?? null);
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

      {isEdit ? (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={updatePassword}
              onChange={(e) => setUpdatePassword(e.target.checked)}
            />
            {t("updatePassword")}
          </label>
          {updatePassword && (
            <>
              <Input
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                aria-invalid={!!passwordError}
              />
              {passwordError && (
                <p className="text-sm text-destructive" role="alert">
                  {passwordError}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="secret-account-password">{t("password")}</Label>
          <Input
            id="secret-account-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            aria-invalid={!!passwordError}
          />
          {passwordError && (
            <p className="text-sm text-destructive" role="alert">
              {passwordError}
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
