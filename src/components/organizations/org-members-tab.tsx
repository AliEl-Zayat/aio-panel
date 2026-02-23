"use client";

import { useState, useCallback } from "react";
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
import { Plus, LogOut, UserMinus } from "lucide-react";

const LAST_ADMIN_MESSAGE = "Cannot remove or demote the last admin.";
const MEMBERS_QUERY_KEY = (orgId: number) =>
  ["organization", orgId, "members"] as const;

export interface OrgMembersTabProps {
  organizationId: number;
  currentUserRole: string | null;
  currentUserId: number | null;
}

function formatRole(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "MEMBER") return "Member";
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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
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
        setSubmitError(message ?? "This user is already a member.");
      } else if (status === 404) {
        setSubmitError(message ?? "User not found.");
      } else {
        setSubmitError(
          message ??
            (axiosError instanceof Error ? axiosError.message : "Failed to add member.")
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
        <Label htmlFor="add-member-email">Email</Label>
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
        <Label htmlFor="add-member-role">Role</Label>
        <select
          id="add-member-role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value === "ADMIN" ? "ADMIN" : "MEMBER")
          }
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add member"}
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

  const showLastAdminError = useCallback(() => {
    setActionError(LAST_ADMIN_MESSAGE);
  }, []);

  const handleUpdateRole = async (userId: number, newRole: "MEMBER" | "ADMIN") => {
    setActionError(null);
    try {
      await organizationService.updateMemberRole(organizationId, userId, {
        role: newRole,
      });
      invalidateMembers();
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
          "Failed to update role."
      );
    }
  };

  const handleRemoveMember = async (userId: number, label: string) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to remove ${label} from this organization?`
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await organizationService.removeMember(organizationId, userId);
      invalidateMembers();
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
        axiosError.response?.data?.error ?? "Failed to remove member."
      );
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
          {error instanceof Error ? error.message : "Failed to load members."}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Members</h3>
        {isAdmin && (
          <Button
            type="button"
            size="sm"
            onClick={() => setAddMemberOpen(true)}
            aria-label="Add member"
          >
            <Plus className="size-4" />
            Add member
          </Button>
        )}
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm">No members yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium">Name / Email</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 font-medium">Actions</th>
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
                    <td className="py-2 pr-4">{formatRole(member.role)}</td>
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
                                Set as Admin
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateRole(member.userId, "MEMBER")}
                              >
                                Set as Member
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId, label)}
                              aria-label={`Remove ${label}`}
                            >
                              <UserMinus className="size-4" />
                              Remove
                            </Button>
                          </>
                        )}
                        {isSelf && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveMember(member.userId, "yourself")
                            }
                            aria-label="Leave organization"
                          >
                            <LogOut className="size-4" />
                            Leave organization
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
            <SheetTitle>Add member</SheetTitle>
            <SheetDescription>
              Invite someone by email. They must already have an account.
            </SheetDescription>
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
