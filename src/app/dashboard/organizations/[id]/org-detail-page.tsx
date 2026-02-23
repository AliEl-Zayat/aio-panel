"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organization.service";
import { OrgDetailTabs } from "@/components/organizations/org-detail-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function NotFoundView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">Organization not found</h2>
      <p className="text-muted-foreground">
        The organization may have been removed or you do not have access.
      </p>
      <Link
        href="/dashboard/organizations"
        className="text-primary hover:underline font-medium"
      >
        ← Back to organizations
      </Link>
    </div>
  );
}

export function OrgDetailPage({ id }: { id: number }) {
  const {
    data: org,
    isLoading: orgLoading,
    isError: orgError,
    error: orgErr,
  } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationService.getById(id),
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.list(),
  });

  const membership = memberships.find((m) => m.id === id);
  const currentUserRole = membership?.role ?? null;

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orgError) {
    const status = orgErr && typeof orgErr === "object" && "response" in orgErr
      ? (orgErr as { response?: { status?: number } }).response?.status
      : undefined;
    if (status === 404) {
      return <NotFoundView />;
    }
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-medium">Error</h2>
        <p className="text-destructive">
          {orgErr instanceof Error ? orgErr.message : "Failed to load organization."}
        </p>
        <Link
          href="/dashboard/organizations"
          className="text-primary hover:underline font-medium"
        >
          ← Back to organizations
        </Link>
      </div>
    );
  }

  if (!org) {
    return <NotFoundView />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{org.name}</h2>
      <OrgDetailTabs
        organization={org}
        organizationId={id}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
