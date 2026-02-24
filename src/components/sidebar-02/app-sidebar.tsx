"use client";

import { useTranslations } from "next-intl";
import { usePreferences } from "@/hooks/use-preferences";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Bug,
  Building2,
  Code,
  DollarSign,
  FolderKanban,
  Home,
  Key,
  Mail,
  Music,
  Settings,
  BookOpen,
  Lightbulb,
  Package,
  GitBranch,
  UserCog,
} from "lucide-react";
import { Logo } from "@/components/sidebar-02/logo";
import type { Route } from "./nav-main";
import DashboardNavigation from "@/components/sidebar-02/nav-main";
import { NotificationsPopover } from "@/components/sidebar-02/nav-notifications";
import { TeamSwitcher } from "@/components/sidebar-02/team-switcher";

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "New order received.",
    time: "10m ago",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "Server upgrade completed.",
    time: "1h ago",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "New user signed up.",
    time: "2h ago",
  },
];

function useDashboardRoutes(): Route[] {
  const t = useTranslations("nav");
  return [
    {
      id: "dashboard",
      title: t("dashboard"),
      icon: <Home className="size-4" />,
      link: "/dashboard",
    },
    {
      id: "api-reporter",
      title: t("apiReporter"),
      icon: <Bug className="size-4" />,
      link: "/dashboard/api-reporter",
    },
    {
      id: "organizations",
      title: t("organizations"),
      icon: <Building2 className="size-4" />,
      link: "/dashboard/organizations",
    },
    {
      id: "projects",
      title: t("projects"),
      icon: <FolderKanban className="size-4" />,
      link: "/dashboard/projects",
    },
    {
      id: "command-snippets",
      title: t("commandSnippets"),
      icon: <Code className="size-4" />,
      link: "/dashboard/command-snippets",
    },
    {
      id: "email-templater",
      title: t("emailTemplater"),
      icon: <Mail className="size-4" />,
      link: "/dashboard/email-templates",
    },
    {
      id: "knowledge-area",
      title: t("knowledgeArea"),
      icon: <BookOpen className="size-4" />,
      link: "/dashboard/knowledge",
    },
    {
      id: "topic-research",
      title: t("topicResearch"),
      icon: <Lightbulb className="size-4" />,
      link: "#",
    },
    {
      id: "music-bookmarker",
      title: t("musicBookmarker"),
      icon: <Music className="size-4" />,
      link: "#",
    },
    {
      id: "finance-helper",
      title: t("financeHelper"),
      icon: <DollarSign className="size-4" />,
      link: "#",
    },
    {
      id: "side-budget",
      title: t("sideBudget"),
      icon: <Package className="size-4" />,
      link: "#",
    },
    {
      id: "ci-cd-pipelines",
      title: t("ciCdPipelines"),
      icon: <GitBranch className="size-4" />,
      link: "#",
    },
    {
      id: "secret-keys",
      title: t("secretKeys"),
      icon: <Key className="size-4" />,
      link: "#",
    },
    {
      id: "secret-accounts",
      title: t("secretAccounts"),
      icon: <UserCog className="size-4" />,
      link: "#",
    },
    {
      id: "settings",
      title: t("settings"),
      icon: <Settings className="size-4" />,
      link: "#",
    },
  ];
}

type SidebarSide = "left" | "right";

const SIDEBAR_VARIANT_MAP = {
  INSET: "inset",
  SIDEBAR: "sidebar",
  FLOATING: "floating",
} as const;
const SIDEBAR_COLLAPSE_MAP = {
  ICON: "icon",
  OFF_CANVAS: "offcanvas",
} as const;

export function DashboardSidebar({
  side = "left",
}: { side?: SidebarSide } = {}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const dashboardRoutes = useDashboardRoutes();
  const { preferences } = usePreferences();
  const variant =
    SIDEBAR_VARIANT_MAP[preferences.sidebarStyle] ?? "inset";
  const collapsible =
    SIDEBAR_COLLAPSE_MAP[preferences.sidebarCollapseMode] ?? "icon";

  return (
    <Sidebar variant={variant} collapsible={collapsible} side={side}>
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between"
        )}
      >
        <a href="#" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-semibold text-black dark:text-white">
              Acme
            </span>
          )}
        </a>

        <motion.div
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <NotificationsPopover notifications={sampleNotifications} />
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <TeamSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
