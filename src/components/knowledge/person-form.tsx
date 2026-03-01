"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { peopleService } from "@/services/people.service";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type {
  Person,
  Company,
  OrganizationMembership,
  Project,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

type LinkType = "common" | "company" | "organization" | "project";

interface PersonFormValues {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  notes: string;
  fcmToken: string;
  linkType: LinkType;
  linkId: string;
}

function getEmptyPersonFormValues(): PersonFormValues {
  return {
    name: "",
    email: "",
    phoneCountryCode: "",
    phoneNumber: "",
    notes: "",
    fcmToken: "",
    linkType: "common",
    linkId: "",
  };
}

/** Country dial codes for phone select (code used when saving). Flag = Unicode regional indicator emoji. */
const PHONE_COUNTRY_CODES: { code: string; label: string; flag: string }[] = [
  { code: "", label: "—", flag: "" },
  { code: "+20", label: "EG +20", flag: "🇪🇬" },
  { code: "+1", label: "US/CA +1", flag: "🇺🇸" },
  { code: "+44", label: "UK +44", flag: "🇬🇧" },
  { code: "+33", label: "FR +33", flag: "🇫🇷" },
  { code: "+49", label: "DE +49", flag: "🇩🇪" },
  { code: "+39", label: "IT +39", flag: "🇮🇹" },
  { code: "+34", label: "ES +34", flag: "🇪🇸" },
  { code: "+966", label: "SA +966", flag: "🇸🇦" },
  { code: "+971", label: "AE +971", flag: "🇦🇪" },
  { code: "+965", label: "KW +965", flag: "🇰🇼" },
  { code: "+973", label: "BH +973", flag: "🇧🇭" },
  { code: "+974", label: "QA +974", flag: "🇶🇦" },
  { code: "+968", label: "OM +968", flag: "🇴🇲" },
  { code: "+962", label: "JO +962", flag: "🇯🇴" },
  { code: "+961", label: "LB +961", flag: "🇱🇧" },
  { code: "+963", label: "SY +963", flag: "🇸🇾" },
  { code: "+964", label: "IQ +964", flag: "🇮🇶" },
  { code: "+213", label: "DZ +213", flag: "🇩🇿" },
  { code: "+212", label: "MA +212", flag: "🇲🇦" },
  { code: "+216", label: "TN +216", flag: "🇹🇳" },
  { code: "+218", label: "LY +218", flag: "🇱🇾" },
  { code: "+249", label: "SD +249", flag: "🇸🇩" },
  { code: "+31", label: "NL +31", flag: "🇳🇱" },
  { code: "+32", label: "BE +32", flag: "🇧🇪" },
  { code: "+41", label: "CH +41", flag: "🇨🇭" },
  { code: "+43", label: "AT +43", flag: "🇦🇹" },
  { code: "+46", label: "SE +46", flag: "🇸🇪" },
  { code: "+47", label: "NO +47", flag: "🇳🇴" },
  { code: "+45", label: "DK +45", flag: "🇩🇰" },
  { code: "+358", label: "FI +358", flag: "🇫🇮" },
  { code: "+48", label: "PL +48", flag: "🇵🇱" },
  { code: "+90", label: "TR +90", flag: "🇹🇷" },
  { code: "+7", label: "RU/KZ +7", flag: "🇷🇺" },
  { code: "+91", label: "IN +91", flag: "🇮🇳" },
  { code: "+86", label: "CN +86", flag: "🇨🇳" },
  { code: "+81", label: "JP +81", flag: "🇯🇵" },
  { code: "+82", label: "KR +82", flag: "🇰🇷" },
  { code: "+61", label: "AU +61", flag: "🇦🇺" },
  { code: "+55", label: "BR +55", flag: "🇧🇷" },
  { code: "+52", label: "MX +52", flag: "🇲🇽" },
  { code: "+27", label: "ZA +27", flag: "🇿🇦" },
  { code: "+234", label: "NG +234", flag: "🇳🇬" },
  { code: "+254", label: "KE +254", flag: "🇰🇪" },
];

function parsePhoneForDisplay(full: string | null | undefined): {
  countryCode: string;
  number: string;
} {
  if (!full || !full.trim()) return { countryCode: "", number: "" };
  const trimmed = full.trim();
  const withCode = PHONE_COUNTRY_CODES.filter((c) => c.code.length > 0);
  withCode.sort((a, b) => b.code.length - a.code.length);
  for (const { code } of withCode) {
    if (
      trimmed === code ||
      trimmed.startsWith(code + " ") ||
      trimmed.startsWith(code + "-") ||
      (trimmed.startsWith(code) && trimmed.length > code.length)
    ) {
      const rest = trimmed.slice(code.length).replace(/^[\s-]+/, "").trim();
      return { countryCode: code, number: rest };
    }
  }
  return { countryCode: "", number: trimmed };
}

export interface PersonFormProps {
  readonly person?: Person | null;
  readonly companies: Company[];
  readonly organizations: OrganizationMembership[];
  readonly projects: Project[];
  readonly onSuccess: (person: Person) => void;
  readonly onCancel?: () => void;
}

function getInitialLink(
  person: Person | null | undefined
): { type: LinkType; id: string } {
  if (!person) return { type: "common", id: "" };
  if (person.companyId != null) return { type: "company", id: String(person.companyId) };
  if (person.organizationId != null)
    return { type: "organization", id: String(person.organizationId) };
  if (person.projectId != null) return { type: "project", id: String(person.projectId) };
  return { type: "common", id: "" };
}

function personToFormValues(p: Person): PersonFormValues {
  const parsed = parsePhoneForDisplay(p.phone);
  const initial = getInitialLink(p);
  return {
    name: p.name,
    email: p.email ?? "",
    phoneCountryCode: parsed.countryCode,
    phoneNumber: parsed.number,
    notes: p.notes ?? "",
    fcmToken: p.fcmToken ?? "",
    linkType: initial.type,
    linkId: initial.id,
  };
}

export function PersonForm({
  person,
  companies,
  organizations,
  projects,
  onSuccess,
  onCancel,
}: PersonFormProps) {
  const t = useTranslations("knowledge");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const isEdit = person !== undefined && person !== null;
  const defaultValues: PersonFormValues =
    isEdit && person ? personToFormValues(person) : getEmptyPersonFormValues();
  const storageKey =
    isEdit && person
      ? `form-draft:person:edit:${person.id}`
      : "form-draft:person:new";
  const [formValues, setFormValues, clearDraft] = usePersistedFormState(
    storageKey,
    defaultValues,
    { debounceMs: 400 }
  );
  const {
    name,
    email,
    phoneCountryCode,
    phoneNumber,
    notes,
    fcmToken,
    linkType,
    linkId,
  } = formValues;

  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t("nameRequired"));
      return;
    }
    setNameError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    const numId = linkId ? Number(linkId) : null;
    const companyId = linkType === "company" && numId ? numId : null;
    const organizationId =
      linkType === "organization" && numId ? numId : null;
    const projectId = linkType === "project" && numId ? numId : null;

    const phoneValue =
      phoneNumber.trim() === ""
        ? null
        : phoneCountryCode
          ? `${phoneCountryCode} ${phoneNumber.trim()}`.trim()
          : phoneNumber.trim() || null;

    try {
      if (isEdit) {
        const updated = await peopleService.update(person!.id, {
          name: trimmedName,
          email: email.trim() || null,
          phone: phoneValue,
          notes: notes.trim() || null,
          fcmToken: fcmToken.trim() || null,
          companyId,
          organizationId,
          projectId,
        });
        clearDraft();
        onSuccess(updated);
      } else {
        const created = await peopleService.create({
          name: trimmedName,
          email: email.trim() || null,
          phone: phoneValue,
          notes: notes.trim() || null,
          fcmToken: fcmToken.trim() || null,
          companyId,
          organizationId,
          projectId,
        });
        clearDraft();
        onSuccess(created);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const fallback = isEdit ? t("updatePersonError") : t("createPersonError");
      setSubmitError(
        axiosError.response?.data?.error ??
          (axiosError instanceof Error ? axiosError.message : fallback)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSecondSelect =
    linkType === "company" ||
    linkType === "organization" ||
    linkType === "project";
  const options =
    linkType === "company"
      ? companies
      : linkType === "organization"
        ? organizations
        : linkType === "project"
          ? projects
          : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="person-name">{t("personName")}</Label>
        <Input
          id="person-name"
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setFormValues((prev) => ({ ...prev, name: v }));
            if (v.trim()) setNameError(null);
          }}
          placeholder="Jane Doe"
          maxLength={200}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "person-name-error" : undefined}
        />
        {nameError && (
          <p id="person-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="person-email">{t("email")}</Label>
        <Input
          id="person-email"
          type="email"
          value={email}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="jane@example.com"
          maxLength={255}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="person-phone">{t("phone")}</Label>
        <div className="flex gap-2">
          <select
            id="person-phone-country"
            aria-label={t("phoneCountryCode")}
            value={phoneCountryCode}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                phoneCountryCode: e.target.value,
              }))
            }
            className={cn(
              "flex h-9 w-[7rem] shrink-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
          >
            {PHONE_COUNTRY_CODES.map(({ code, label, flag }) => (
              <option key={code || "none"} value={code}>
                {flag ? `${flag} ${label}` : label}
              </option>
            ))}
          </select>
          <Input
            id="person-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phoneNumber}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder={t("phoneNumberPlaceholder")}
            maxLength={20}
            className="min-w-0 flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="person-notes">{t("notes")}</Label>
        <textarea
          id="person-notes"
          value={notes}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder={t("notesPlaceholder")}
          rows={2}
          maxLength={5000}
          className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="person-fcm">{t("fcmToken")}</Label>
        <Input
          id="person-fcm"
          value={fcmToken}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, fcmToken: e.target.value }))
          }
          placeholder={t("fcmTokenPlaceholder")}
          maxLength={500}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("linkTo")}</Label>
        <select
          value={linkType}
          onChange={(e) => {
            const v = e.target.value as LinkType;
            setFormValues((prev) => ({ ...prev, linkType: v, linkId: "" }));
          }}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        >
          <option value="common">{t("common")}</option>
          <option value="company">{t("companies")}</option>
          <option value="organization">{tNav("organizations")}</option>
          <option value="project">{tNav("projects")}</option>
        </select>
      </div>
      {showSecondSelect && options.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="person-link-id">
            {linkType === "company"
              ? t("company")
              : linkType === "organization"
                ? tNav("organizations")
                : tNav("projects")}
          </Label>
          <select
            id="person-link-id"
            value={linkId}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, linkId: e.target.value }))
            }
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.id} value={String(o.id)}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
