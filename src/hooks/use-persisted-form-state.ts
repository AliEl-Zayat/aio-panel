"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_DEBOUNCE_MS = 400;

function getStorage(): Storage | null {
  try {
    if (typeof globalThis.window === "undefined") return null;
    return (globalThis as unknown as Window).sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Reads persisted form state from sessionStorage.
 * Merges with defaultState so new/added keys get default values.
 */
function readPersisted<T extends object>(
  key: string,
  defaultState: T,
  storage: Storage | null
): T {
  if (!storage) return defaultState;
  try {
    const raw = storage.getItem(key);
    if (raw == null || raw === "") return defaultState;
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

/**
 * Persists form state to sessionStorage so it survives refresh/tab close.
 * Use one key per form (e.g. "form-draft:invoice:new" or "form-draft:invoice:edit:123").
 *
 * - On mount: restores from storage (merged with defaultState), or uses defaultState.
 * - On state change: debounced write to storage.
 * - clearDraft(): removes the key (call on submit success so next visit is fresh).
 */
export function usePersistedFormState<T extends object>(
  storageKey: string,
  defaultState: T,
  options?: { debounceMs?: number }
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const storage = getStorage();

  const [state, setState] = useState<T>(() =>
    readPersisted(storageKey, defaultState, storage)
  );

  const clearDraft = useCallback(() => {
    if (storage) storage.removeItem(storageKey);
  }, [storageKey]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (!storage) return;
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const t = setTimeout(() => {
      try {
        storage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // quota or private mode
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [storageKey, state, debounceMs]);

  return [state, setState, clearDraft];
}
