"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  knowledgeTaskService,
  type TaskListFilter,
} from "@/services/knowledge-task.service";
import { companyService } from "@/services/company.service";
import { organizationService } from "@/services/organization.service";
import { projectService } from "@/services/project.service";
import type { KnowledgeTask, KnowledgeTaskStatus } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentControl } from "@/components/ui/segment-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { TaskForm } from "./task-form";
import { StatusBadge } from "./status-badge";
import { useKnowledgeViewPreferences } from "./use-knowledge-view-preferences";
import { useCurrentOrg } from "@/contexts/current-org-context";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

const STATUS_COLUMN_IDS: KnowledgeTaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];
const COLUMN_DROPPABLE_PREFIX = "column-";

const TASKS_QUERY_KEY = ["knowledge-tasks"] as const;
const COMPANIES_QUERY_KEY = ["companies"] as const;
const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const;
const PROJECTS_QUERY_KEY = ["projects"] as const;

function filterToTaskListFilter(filter: string): TaskListFilter {
  if (filter === "all") return { type: "all" };
  if (filter === "common") return { type: "common" };
  if (filter.startsWith("company-")) {
    const n = Number(filter.slice(8));
    return Number.isInteger(n) ? { type: "company", id: n } : { type: "all" };
  }
  if (filter.startsWith("org-")) {
    const n = Number(filter.slice(4));
    return Number.isInteger(n)
      ? { type: "organization", id: n }
      : { type: "all" };
  }
  if (filter.startsWith("project-")) {
    const n = Number(filter.slice(8));
    return Number.isInteger(n) ? { type: "project", id: n } : { type: "all" };
  }
  return { type: "all" };
}

function getTaskContextLabel(
  task: KnowledgeTask,
  t: ReturnType<typeof useTranslations<"knowledge">>
): string {
  if (task.company?.name) return task.company.name;
  if (task.organization?.name) return task.organization.name;
  if (task.project?.name) return task.project.name;
  return t("common");
}

function getStatusLabel(
  status: KnowledgeTask["status"],
  t: ReturnType<typeof useTranslations<"knowledge">>
): string {
  switch (status) {
    case "TODO":
      return t("statusTodo");
    case "IN_PROGRESS":
      return t("statusInProgress");
    case "DONE":
      return t("statusDone");
    case "BLOCKED":
      return t("statusBlocked");
    default:
      return t("statusTodo");
  }
}

function SortableTableRow({
  task,
  density,
  t,
  tCommon,
  getTaskContextLabel,
  onEdit,
  onDelete,
}: Readonly<{
  task: KnowledgeTask;
  density: "compact" | "expanded";
  t: ReturnType<typeof useTranslations<"knowledge">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
  getTaskContextLabel: (task: KnowledgeTask, t: ReturnType<typeof useTranslations<"knowledge">>) => string;
  onEdit: (task: KnowledgeTask) => void;
  onDelete: (task: KnowledgeTask) => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b last:border-b-0 hover:bg-muted/30 ${isDragging ? "opacity-50" : ""}`}
    >
      <td className="p-2 w-8 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="size-4 text-muted-foreground" aria-hidden />
      </td>
      <td className="p-4 font-medium">{task.title}</td>
      {density === "expanded" && (
        <td className="p-4 text-muted-foreground max-w-[200px] truncate">
          {task.body ?? "—"}
        </td>
      )}
      <td className="p-4">{getTaskContextLabel(task, t)}</td>
      <td className="p-4">
        <StatusBadge
          status={task.status ?? "TODO"}
          variant="icon"
          blockageReason={task.blockageReason}
        />
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
            <Pencil className="size-4" />
            {t("edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(task)}
          >
            <Trash2 className="size-4" />
            {t("deleteTask")}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function SortableTaskCard({
  task,
  density,
  t,
  getTaskContextLabel,
  onEdit,
  onDelete,
}: Readonly<{
  task: KnowledgeTask;
  density: "compact" | "expanded";
  t: ReturnType<typeof useTranslations<"knowledge">>;
  getTaskContextLabel: (task: KnowledgeTask, t: ReturnType<typeof useTranslations<"knowledge">>) => string;
  onEdit: (task: KnowledgeTask) => void;
  onDelete: (task: KnowledgeTask) => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="cursor-grab active:cursor-grabbing shrink-0 touch-none p-1 -m-1"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {getTaskContextLabel(task, t)} ·{" "}
                    <StatusBadge
                      status={task.status ?? "TODO"}
                      variant="simple"
                      blockageReason={task.blockageReason}
                    />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                  <Pencil className="size-4" />
                  {t("edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="size-4" />
                  {t("deleteTask")}
                </Button>
              </div>
            </div>
            {density === "expanded" && (
              <p className="text-sm text-muted-foreground">{task.body ?? "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function ColumnTaskCard({
  task,
  t,
  getTaskContextLabel,
  onEdit,
  onDelete,
}: Readonly<{
  task: KnowledgeTask;
  t: ReturnType<typeof useTranslations<"knowledge">>;
  getTaskContextLabel: (task: KnowledgeTask, t: ReturnType<typeof useTranslations<"knowledge">>) => string;
  onEdit: (task: KnowledgeTask) => void;
  onDelete: (task: KnowledgeTask) => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {getTaskContextLabel(task, t)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(task)} aria-label={t("edit")}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => onDelete(task)} aria-label={t("deleteTask")}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
          {task.body && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.body}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({
  status,
  tasks,
  t,
  getTaskContextLabel,
  onEdit,
  onDelete,
}: Readonly<{
  status: KnowledgeTaskStatus;
  tasks: KnowledgeTask[];
  t: ReturnType<typeof useTranslations<"knowledge">>;
  getTaskContextLabel: (task: KnowledgeTask, t: ReturnType<typeof useTranslations<"knowledge">>) => string;
  onEdit: (task: KnowledgeTask) => void;
  onDelete: (task: KnowledgeTask) => void;
}>) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_DROPPABLE_PREFIX}${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-2 min-h-[200px] p-2 transition-colors ${isOver ? "border-primary bg-primary/5" : "border-muted bg-muted/30"}`}
    >
      <h3 className="text-sm font-semibold px-1 py-2 flex items-center gap-2">
        <StatusBadge status={status} variant="icon" />
        <span className="text-muted-foreground">({tasks.length})</span>
      </h3>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2 flex-1">
          {tasks.map((task) => (
            <li key={task.id}>
              <ColumnTaskCard
                task={task}
                t={t}
                getTaskContextLabel={getTaskContextLabel}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

export function TasksList() {
  const t = useTranslations("knowledge");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrg();
  const [filter, setFilter] = useState<string>("all");
  const hasAppliedOrgDefault = useRef(false);
  useEffect(() => {
    if (hasAppliedOrgDefault.current) return;
    if (currentOrganizationId != null) {
      setFilter(`org-${currentOrganizationId}`);
      hasAppliedOrgDefault.current = true;
    }
  }, [currentOrganizationId]);
  const { view, setView, density, setDensity } = useKnowledgeViewPreferences();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KnowledgeTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [pendingBlockReason, setPendingBlockReason] = useState<{
    task: KnowledgeTask;
    newStatus: "BLOCKED";
  } | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: () => companyService.list(),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: () => organizationService.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => projectService.list("all"),
  });

  const taskListFilter = useMemo(
    () => filterToTaskListFilter(filter),
    [filter]
  );

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...TASKS_QUERY_KEY, filter],
    queryFn: () => knowledgeTaskService.list(taskListFilter),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const taskIds = tasks.map((t) => t.id);
      const oldIndex = taskIds.indexOf(active.id as number);
      const newIndex = taskIds.indexOf(over.id as number);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(tasks, oldIndex, newIndex);
      const orderedIds = reordered.map((t) => t.id);
      queryClient.setQueryData(
        [...TASKS_QUERY_KEY, filter],
        reordered
      );
      setReorderError(null);
      try {
        await knowledgeTaskService.reorder(orderedIds);
      } catch {
        setReorderError("Order could not be saved.");
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      }
    },
    [tasks, filter, queryClient]
  );

  const resolveNewStatusFromOver = useCallback(
    (overId: string | number): KnowledgeTaskStatus | null => {
      if (typeof overId === "string" && overId.startsWith(COLUMN_DROPPABLE_PREFIX)) {
        const status = overId.slice(COLUMN_DROPPABLE_PREFIX.length) as KnowledgeTaskStatus;
        return STATUS_COLUMN_IDS.includes(status) ? status : null;
      }
      if (typeof overId === "number") {
        const task = tasks.find((t) => t.id === overId);
        return task?.status ?? null;
      }
      return null;
    },
    [tasks]
  );

  const handleColumnDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const taskId = active.id as number;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newStatus = resolveNewStatusFromOver(over.id as string | number);
      if (!newStatus || newStatus === task.status) return;
      if (newStatus === "BLOCKED") {
        setBlockReasonInput("");
        setPendingBlockReason({ task, newStatus });
        return;
      }
      setActionError(null);
      setIsUpdatingStatus(true);
      try {
        await knowledgeTaskService.update(taskId, { status: newStatus });
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      } catch (err) {
        const axiosError = err as AxiosError<{ error?: string }>;
        setActionError(axiosError.response?.data?.error ?? t("updateTaskError"));
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [tasks, resolveNewStatusFromOver, queryClient, t]
  );

  const handleConfirmBlockReason = useCallback(async () => {
    if (!pendingBlockReason) return;
    const reason = blockReasonInput.trim();
    if (!reason) return;
    setActionError(null);
    setIsUpdatingStatus(true);
    try {
      await knowledgeTaskService.update(pendingBlockReason.task.id, {
        status: "BLOCKED",
        blockageReason: reason,
      });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      setPendingBlockReason(null);
      setBlockReasonInput("");
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setActionError(axiosError.response?.data?.error ?? t("updateTaskError"));
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [pendingBlockReason, blockReasonInput, queryClient, t]);

  const filterOptions: { value: string; label: string }[] = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: t("filterAll") },
      { value: "common", label: t("filterCommon") },
    ];
    companies.forEach((c) => {
      opts.push({ value: `company-${c.id}`, label: c.name });
    });
    organizations.forEach((o) => {
      opts.push({ value: `org-${o.id}`, label: o.name });
    });
    projects.forEach((p) => {
      opts.push({ value: `project-${p.id}`, label: p.name });
    });
    return opts;
  }, [companies, organizations, projects, t]);

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
  };

  const handleCreateSuccess = () => {
    invalidateTasks();
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    invalidateTasks();
    setEditingTask(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await knowledgeTaskService.remove(deleteTarget.id);
      invalidateTasks();
      setDeleteTarget(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setActionError(
        axiosError.response?.data?.error ?? t("deleteTaskError")
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-8 p-2" scope="col" aria-hidden />
                  <th className="text-left font-medium p-4" scope="col">
                    {t("taskTitle")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {t("taskBody")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {t("context")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {t("status")}
                  </th>
                  <th className="text-right font-medium p-4" scope="col">
                    {tCommon("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-2 w-8" />
                    <td className="p-4">
                      <Skeleton className="h-5 w-40" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-20" />
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

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : t("loadTasksError")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {tCommon("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentControl
            value={filter}
            options={filterOptions}
            onValueChange={setFilter}
            aria-label={t("filterByCompany")}
          />
          <SegmentControl
            value={view}
            options={[
              { value: "table", label: t("viewTable") },
              { value: "cards", label: t("viewCards") },
              { value: "columns", label: t("viewColumns") },
            ]}
            onValueChange={(v) => setView(v as "table" | "cards" | "columns")}
            aria-label="View mode"
          />
          <SegmentControl
            value={density}
            options={[
              { value: "compact", label: t("densityCompact") },
              { value: "expanded", label: t("densityExpanded") },
            ]}
            onValueChange={(v) => setDensity(v as "compact" | "expanded")}
            aria-label="Density"
          />
        </div>
        <Button
          title={t("addTask")}
          aria-label={t("addTask")}
          onClick={() => {
            setActionError(null);
            setEditingTask(null);
            setCreateOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t("addTask")}
        </Button>
      </div>

      {(actionError || reorderError) && (
        <p role="alert" className="text-sm text-destructive">
          {actionError ?? reorderError}
        </p>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTask")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteTaskConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("deleteTask")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noTasksYet")}</p>
            <Button
              title={t("addTask")}
              aria-label={t("addTask")}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              {t("addTask")}
            </Button>
          </CardContent>
        </Card>
      ) : view === "columns" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleColumnDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUS_COLUMN_IDS.map((status) => (
              <DroppableColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => (t.status ?? "TODO") === status)}
                t={t}
                getTaskContextLabel={getTaskContextLabel}
                onEdit={(task) => {
                  setActionError(null);
                  setCreateOpen(false);
                  setEditingTask(task);
                }}
                onDelete={(task) => {
                  setActionError(null);
                  setDeleteTarget(task);
                }}
              />
            ))}
          </div>
        </DndContext>
      ) : view === "cards" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3" role="list">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  density={density}
                  t={t}
                  getTaskContextLabel={getTaskContextLabel}
                  onEdit={(task) => {
                    setActionError(null);
                    setCreateOpen(false);
                    setEditingTask(task);
                  }}
                  onDelete={(task) => {
                    setActionError(null);
                    setDeleteTarget(task);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <Card>
              <CardHeader className="sr-only">
                <span>{t("tasks")}</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-8 p-2" scope="col" aria-hidden>
                          <span className="sr-only">Drag to reorder</span>
                        </th>
                        <th className="text-left font-medium p-4" scope="col">
                          {t("taskTitle")}
                        </th>
                        {density === "expanded" && (
                          <th className="text-left font-medium p-4" scope="col">
                            {t("taskBody")}
                          </th>
                        )}
                        <th className="text-left font-medium p-4" scope="col">
                          {t("context")}
                        </th>
                        <th className="text-left font-medium p-4" scope="col">
                          {t("status")}
                        </th>
                        <th className="text-right font-medium p-4" scope="col">
                          {tCommon("actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <SortableTableRow
                          key={task.id}
                          task={task}
                          density={density}
                          t={t}
                          tCommon={tCommon}
                          getTaskContextLabel={getTaskContextLabel}
                          onEdit={(task) => {
                            setActionError(null);
                            setCreateOpen(false);
                            setEditingTask(task);
                          }}
                          onDelete={(task) => {
                            setActionError(null);
                            setDeleteTarget(task);
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </SortableContext>
        </DndContext>
      )}

      <Dialog
        open={!!pendingBlockReason}
        onOpenChange={(open) => {
          if (!open) setPendingBlockReason(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("enterBlockReason")}</DialogTitle>
            <DialogDescription>{t("blockReasonRequired")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="block-reason">{t("blockageReason")}</Label>
            <textarea
              id="block-reason"
              value={blockReasonInput}
              onChange={(e) => setBlockReasonInput(e.target.value)}
              placeholder={t("blockageReasonPlaceholder")}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background/80 backdrop-blur-sm px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingBlockReason(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleConfirmBlockReason}
              disabled={!blockReasonInput.trim() || isUpdatingStatus}
            >
              {isUpdatingStatus ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingTask(null);
          }
        }}
      >
        <DialogContent className="overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {createOpen ? t("createTask") : t("editTask")}
            </DialogTitle>
            <DialogDescription>
              {createOpen ? t("createTaskDescription") : t("editTaskDescription")}
            </DialogDescription>
          </DialogHeader>
          {createOpen && (
            <TaskForm
              companies={companies}
              organizations={organizations}
              projects={projects}
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
              initialScope={
                currentOrganizationId != null
                  ? { organizationId: currentOrganizationId }
                  : undefined
              }
            />
          )}
          {!createOpen && editingTask && (
            <TaskForm
              task={editingTask}
              companies={companies}
              organizations={organizations}
              projects={projects}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
