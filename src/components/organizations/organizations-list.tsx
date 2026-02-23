"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { organizationService } from "@/services/organization.service";
import type { OrganizationMembership } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

function formatRole(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "MEMBER") return "Member";
  return role;
}

function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

export function OrganizationsList() {
  const queryClient = useQueryClient();
  const {
    data: organizations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.list(),
  });

  async function handleRemove(id: number, name: string) {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete the organization "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await organizationService.remove(id);
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
    } catch (err) {
      console.error("Failed to delete organization:", err);
      globalThis.alert("Failed to delete organization. Please try again.");
    }
  }

  if (isLoading) {
    return <OrganizationsListSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : "Failed to load organizations."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">No organizations yet</p>
          <Button>
            <Plus className="size-4" />
            Create organization
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button>
          <Plus className="size-4" />
          Create organization
        </Button>
      </div>
      <Card>
        <CardHeader className="sr-only">
          <span>Organizations list</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">Name</th>
                  <th className="text-left font-medium p-4">Slug</th>
                  <th className="text-left font-medium p-4">Role</th>
                  <th className="text-right font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org: OrganizationMembership) => (
                  <tr
                    key={org.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="p-4 font-medium">{org.name}</td>
                    <td className="p-4 text-muted-foreground">{org.slug}</td>
                    <td className="p-4">{formatRole(org.role)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/organizations/${org.id}`}>
                            <Eye className="size-4" />
                            View
                          </Link>
                        </Button>
                        {isAdmin(org.role) && (
                          <>
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/dashboard/organizations/${org.id}?tab=details`}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemove(org.id, org.name)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationsListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium p-4">Name</th>
                <th className="text-left font-medium p-4">Slug</th>
                <th className="text-left font-medium p-4">Role</th>
                <th className="text-right font-medium p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="p-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-5 w-24" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="p-4 text-right">
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
