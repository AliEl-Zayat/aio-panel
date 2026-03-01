"use client";

import { useTranslations } from "next-intl";
import { Circle, CircleDot, CheckCircle2, Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeTaskStatus } from "@/types/api";

const STATUS_CONFIG: Record<
  KnowledgeTaskStatus,
  { icon: React.ComponentType<{ className?: string }>; variant: "secondary" | "default" | "success" | "destructive" | "muted" | "outline" | "warning"; labelKey: "statusTodo" | "statusInProgress" | "statusDone" | "statusBlocked" }
> = {
  TODO: {
    icon: Circle,
    variant: "secondary",
    labelKey: "statusTodo",
  },
  IN_PROGRESS: {
    icon: CircleDot,
    variant: "default",
    labelKey: "statusInProgress",
  },
  DONE: {
    icon: CheckCircle2,
    variant: "success",
    labelKey: "statusDone",
  },
  BLOCKED: {
    icon: Ban,
    variant: "destructive",
    labelKey: "statusBlocked",
  },
};

export interface StatusBadgeProps {
  status: KnowledgeTaskStatus;
  /** When "icon", show icon + label; when "simple", label only. */
  variant?: "icon" | "simple";
  /** Optional blockage reason (shown as tooltip when status is BLOCKED and variant is icon). */
  blockageReason?: string | null;
  className?: string;
}

export function StatusBadge({
  status,
  variant = "icon",
  blockageReason,
  className,
}: Readonly<StatusBadgeProps>) {
  const t = useTranslations("knowledge");
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  const Icon = config.icon;
  const label = t(config.labelKey);

  const badge = (
    <Badge
      variant={config.variant}
      className={className}
    >
      {variant === "icon" && <Icon className="size-3.5 shrink-0" />}
      <span>{label}</span>
    </Badge>
  );

  if (status === "BLOCKED" && variant === "icon" && blockageReason?.trim()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {blockageReason}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
