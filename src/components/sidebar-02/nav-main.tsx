"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export type Route = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link: string;
  subs?: {
    title: string;
    link: string;
    icon?: React.ReactNode;
  }[];
};

export default function DashboardNavigation({
  routes,
}: Readonly<{ routes: Route[] }>) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const openIdFromPath =
    routes.find(
      (r) =>
        r.subs?.length &&
        (pathname.startsWith(r.link) ||
          r.subs.some(
            (s) => pathname === s.link || pathname.startsWith(s.link + "/")
          ))
    )?.id ?? null;
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  useEffect(() => {
    if (openIdFromPath) setOpenCollapsible(openIdFromPath);
  }, [openIdFromPath]);

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const isOpen = !isCollapsed && openCollapsible === route.id;
        const hasSubRoutes = !!route.subs?.length;
        const isActiveTopLevel =
          !hasSubRoutes && pathname === route.link;
        const isActiveCategory =
          hasSubRoutes &&
          (pathname.startsWith(route.link) ||
            (route.subs?.some(
              (s) => pathname === s.link || pathname.startsWith(s.link + "/")
            ) ?? false));

        return (
          <SidebarMenuItem key={route.id}>
            {hasSubRoutes ? (
              isCollapsed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      isActive={isActiveCategory}
                      tooltip={route.title}
                      className={cn(
                        "flex w-full items-center rounded-lg px-2 transition-colors justify-center",
                        "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
                      )}
                    >
                      {route.icon}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="min-w-[10rem]"
                  >
                    {route.subs?.map((subRoute) => (
                      <DropdownMenuItem key={`${route.id}-${subRoute.title}`} asChild>
                        <Link
                          href={subRoute.link}
                          prefetch={true}
                          className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent"
                        >
                          {subRoute.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) =>
                    setOpenCollapsible(open ? route.id : null)
                  }
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isActiveCategory}
                      className={cn(
                        "flex w-full items-center rounded-lg px-2 transition-colors",
                        isOpen
                          ? "bg-sidebar-muted text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
                      )}
                    >
                      {route.icon}
                      <span className="ms-2 flex-1 text-sm font-medium">
                        {route.title}
                      </span>
                      <span className="ms-auto">
                        {isOpen ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="my-1 ms-3.5 ">
                      {route.subs?.map((subRoute) => (
                        <SidebarMenuSubItem
                          key={`${route.id}-${subRoute.title}`}
                          className="h-auto"
                        >
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subRoute.link}
                          >
                            <Link
                              href={subRoute.link}
                              prefetch={true}
                              className="flex items-center rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
                            >
                              {subRoute.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              )
            ) : (
              <SidebarMenuButton
                tooltip={route.title}
                asChild
                isActive={isActiveTopLevel}
              >
                <Link
                  href={route.link}
                  prefetch={true}
                  className={cn(
                    "flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                    isCollapsed && "justify-center"
                  )}
                >
                  {route.icon}
                  {!isCollapsed && (
                    <span className="ms-2 text-sm font-medium">
                      {route.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
