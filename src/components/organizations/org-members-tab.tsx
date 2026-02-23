"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { organizationService } from "@/services/organization.service";
import type { OrganizationMember } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, LogOut, UserMinus } from "lucide-react";

const MEMBERS_QUERY_KEY = (orgId: number) =>
  ["organization", orgId, "members"] as const;

export interface OrgMembersTabProps {
  organizationId: number;
  currentUserRole: string | null;
  currentUserId: number | null;
}

function formatRole(role: string, t: ReturnType<typeof useTranslations<"organizations">>): string {
  if (role === "ADMIN") return t("admin");
  if (role === "MEMBER") return t("member");
  return role;
}

function displayName(member: OrganizationMember): string {
  const u = member.user;
  if (u.name?.trim()) return u.name;
  return u.email;
}

function AddMemberForm({
  organizationId,
  onSuccess,
  onCancel,
}: Readonly<{
  organizationId: number;
  onSuccess: () => void;
  onCancel: () => void;
}>) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t("emailRequired"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t("emailInvalid"));
      return;
    }
    setEmailError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await organizationService.addMember(organizationId, {
        email: trimmed,
        role,
      });
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.error;
      if (status === 409) {
        setSubmitError(message ?? t("alreadyMember"));
      } else if (status === 404) {
        setSubmitError(message ?? t("userNotFound"));
      } else {
        setSubmitError(
          message ??
            (axiosError instanceof Error ? axiosError.message : t("addMemberError"))
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="add-member-email">{t("email")}</Label>
        <Input
          id="add-member-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          placeholder="colleague@example.com"
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "add-member-email-error" : undefined}
        />
        {emailError && (
          <p id="add-member-email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-member-role">{t("role")}</Label>
        <select
          id="add-member-role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value === "ADMIN" ? "ADMIN" : "MEMBER")
          }
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="MEMBER">{t("member")}</option>
          <option value="ADMIN">{t("admin")}</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("adding") : t("addMember")}
        </Button>
      </div>
    </form>
  );
}

export function OrgMembersTab({
  organizationId,
  currentUserRole,
  currentUserId,
}: Readonly<OrgMembersTabProps>) {
  const queryClient = useQueryClient();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ userId: number; label: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: MEMBERS_QUERY_KEY(organizationId),
    queryFn: () => organizationService.listMembers(organizationId),
  });

  const invalidateMembers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY(organizationId) });
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
  }, [queryClient, organizationId]);

  const handleAddSuccess = useCallback(() => {
    invalidateMembers();
    setAddMemberOpen(false);
  }, [invalidateMembers]);

  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const showLastAdminError = useCallback(() => {
    setActionError(t("lastAdminError"));
  }, [t]);

  const handleUpdateRole = async (userId: number, newRole: "MEMBER" | "ADMIN") => {
    setActionError(null);
    try {
      await organizationService.updateMemberRole(organizationId, userId, {
        role: newRole,
      });
      invalidateMembers();
      setActionError(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 400) {
        const msg = axiosError.response?.data?.error;
        if (msg?.toLowerCase().includes("last admin")) {
          showLastAdminError();
          return;
        }
      }
      setActionError(
        (axiosError as AxiosError<{ error?: string }>).response?.data?.error ??
          t("failedToUpdateRole")
      );
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!removeTarget) return;
    setActionError(null);
    setIsRemoving(true);
    try {
      await organizationService.removeMember(organizationId, removeTarget.userId);
      invalidateMembers();
      setRemoveTarget(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const status = axiosError.response?.status;
      const msg = axiosError.response?.data?.error;
      if (status === 400 && msg?.toLowerCase().includes("last admin")) {
        showLastAdminError();
      } else if (status === 404) {
        setActionError(msg ?? t("failedToRemoveMember"));
      } else {
        setActionError(msg ?? t("failedToRemoveMember"));
      }
      setRemoveTarget(null);
    } finally {
      setIsRemoving(false);
    }
  };

  const isAdmin = currentUserRole === "ADMIN";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <p className="text-destructive">
          {error instanceof Error ? error.message : t("loadMembersError")}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("members")}</h3>
        {isAdmin && (
          <Button
            type="button"
            size="sm"
            onClick={() => setAddMemberOpen(true)}
            aria-label={t("addMember")}
          >
            <Plus className="size-4" />
            {t("addMember")}
          </Button>
        )}
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove")}</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? t("removeMemberConfirm", { label: removeTarget.label })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRemoveMember();
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? tCommon("deleting") : t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noMembersYet")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="pb-2 pr-4 font-medium">{tCommon("name")} / {t("email")}</th>
                <th scope="col" className="pb-2 pr-4 font-medium">{t("role")}</th>
                <th scope="col" className="pb-2 font-medium">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const canManage = isAdmin && !isSelf;
                const label = displayName(member);
                return (
                  <tr key={member.userId} className="border-b last:border-0">
                    <td className="py-2 pr-4">{label}</td>
                    <td className="py-2 pr-4">{formatRole(member.role, t)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {canManage && (
                          <>
                            {member.role === "MEMBER" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateRole(member.userId, "ADMIN")}
                              >
                                {t("setAsAdmin")}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateRole(member.userId, "MEMBER")}
                              >
                                {t("setAsMember")}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                              setActionError(null);
                              setRemoveTarget({ userId: member.userId, label });
                            }}
                              aria-label={`${t("remove")} ${label}`}
                            >
                              <UserMinus className="size-4" />
                              {t("remove")}
                            </Button>
                          </>
                        )}
                        {isSelf && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionError(null);
                              setRemoveTarget({
                                userId: member.userId,
                                label: t("yourself"),
                              });
                            }}
                            aria-label={t("leaveOrg")}
                          >
                            <LogOut className="size-4" />
                            {t("leaveOrg")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("addMember")}</SheetTitle>
            <SheetDescription>{t("addMemberDescription")}</SheetDescription>
          </SheetHeader>
          <AddMemberForm
            organizationId={organizationId}
            onSuccess={handleAddSuccess}
            onCancel={() => setAddMemberOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
