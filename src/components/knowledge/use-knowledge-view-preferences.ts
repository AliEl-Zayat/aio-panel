"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_VIEW_KEY = "knowledge-tasks-view";
const STORAGE_DENSITY_KEY = "knowledge-tasks-density";

export type KnowledgeTasksViewMode = "table" | "cards" | "columns";
export type KnowledgeTasksDensity = "compact" | "expanded";

const DEFAULT_VIEW: KnowledgeTasksViewMode = "table";
const DEFAULT_DENSITY: KnowledgeTasksDensity = "expanded";

function readView(): KnowledgeTasksViewMode {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const raw = localStorage.getItem(STORAGE_VIEW_KEY);
  if (raw === "table" || raw === "cards" || raw === "columns") return raw;
  return DEFAULT_VIEW;
}

function readDensity(): KnowledgeTasksDensity {
  if (typeof window === "undefined") return DEFAULT_DENSITY;
  const raw = localStorage.getItem(STORAGE_DENSITY_KEY);
  if (raw === "compact" || raw === "expanded") return raw;
  return DEFAULT_DENSITY;
}

export function useKnowledgeViewPreferences(): {
  view: KnowledgeTasksViewMode;
  setView: (v: KnowledgeTasksViewMode) => void;
  density: KnowledgeTasksDensity;
  setDensity: (d: KnowledgeTasksDensity) => void;
} {
  const [view, setViewState] = useState<KnowledgeTasksViewMode>(DEFAULT_VIEW);
  const [density, setDensityState] = useState<KnowledgeTasksDensity>(DEFAULT_DENSITY);

  useEffect(() => {
    setViewState(readView());
    setDensityState(readDensity());
  }, []);

  const setView = useCallback((v: KnowledgeTasksViewMode) => {
    setViewState(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_VIEW_KEY, v);
  }, []);

  const setDensity = useCallback((d: KnowledgeTasksDensity) => {
    setDensityState(d);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_DENSITY_KEY, d);
  }, []);

  return { view, setView, density, setDensity };
}
