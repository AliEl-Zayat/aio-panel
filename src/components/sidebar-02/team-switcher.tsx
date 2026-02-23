"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentOrg } from "@/contexts/current-org-context";
import { organizationService } from "@/services/organization.service";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronsUpDown, Plus, User } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type Option = { value: number | null; label: string };

function getOptions(orgs: { id: number; name: string }[]): Option[] {
  const personal: Option = { value: null, label: "Personal" };
  const orgOptions: Option[] = orgs.map((o) => ({ value: o.id, label: o.name }));
  return [personal, ...orgOptions];
}

function getSelectedLabel(
  currentOrganizationId: number | null,
  options: Option[]
): string {
  const option = options.find((o) => o.value === currentOrganizationId);
  return option?.label ?? "Personal";
}

function getSelectedIcon(currentOrganizationId: number | null) {
  return currentOrganizationId === null ? User : Building2;
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { currentOrganizationId, setCurrentOrganizationId } = useCurrentOrg();

  const {
    data: orgs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.list(),
  });

  const options = getOptions(orgs);
  const selectedLabel = getSelectedLabel(currentOrganizationId, options);
  const SelectedIcon = getSelectedIcon(currentOrganizationId);

  // Sync context when current org is no longer in the list (e.g. user left the org)
  useEffect(() => {
    if (
      currentOrganizationId !== null &&
      orgs.length > 0 &&
      !orgs.some((o) => o.id === currentOrganizationId)
    ) {
      setCurrentOrganizationId(null);
    }
  }, [currentOrganizationId, orgs, setCurrentOrganizationId]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-background text-foreground">
                {isLoading ? (
                  <span className="size-4 animate-pulse rounded bg-muted" />
                ) : (
                  <SelectedIcon className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">
                  {isLoading ? (
                    <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted" />
                  ) : (
                    selectedLabel
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentOrganizationId === null ? "Personal account" : "Organization"}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg mb-4"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch context
            </DropdownMenuLabel>
            {isError ? (
              <DropdownMenuItem
                className="gap-2 p-2 text-muted-foreground"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-xs">Could not load organizations.</span>
                <button
                  type="button"
                  className="text-xs underline focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={() => refetch()}
                >
                  Retry
                </button>
              </DropdownMenuItem>
            ) : (
              options.map((opt) => {
                const Icon = opt.value === null ? User : Building2;
                return (
                  <DropdownMenuItem
                    key={opt.value ?? "personal"}
                    onClick={() => setCurrentOrganizationId(opt.value)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Icon className="size-4 shrink-0" />
                    </div>
                    {opt.label}
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/organizations"
                className="flex gap-2 p-2 focus:bg-accent focus:text-accent-foreground"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">
                  Add organization
                </span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
