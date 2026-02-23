"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CURRENT_ORG_ID_COOKIE_NAME = "current_org_id";
const CURRENT_ORG_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export type CurrentOrgContextValue = {
  currentOrganizationId: number | null;
  setCurrentOrganizationId: (id: number | null) => void;
};

const defaultValue: CurrentOrgContextValue = {
  currentOrganizationId: null,
  setCurrentOrganizationId: () => {},
};

const CurrentOrgContext = createContext<CurrentOrgContextValue>(defaultValue);

const CURRENT_ORG_ID_REGEX = new RegExp(
  `(?:^|;\\s*)${CURRENT_ORG_ID_COOKIE_NAME}=([^;]*)`
);

function getCurrentOrgIdFromCookie(): number | null {
  if (typeof document === "undefined") return null;
  const match = CURRENT_ORG_ID_REGEX.exec(document.cookie);
  const value = match?.[1];
  if (value === undefined || value === "") return null;
  const parsed = Number.parseInt(decodeURIComponent(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function setCurrentOrgIdCookie(id: number | null): void {
  if (typeof document === "undefined") return;
  if (id === null) {
    document.cookie = `${CURRENT_ORG_ID_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  const value = encodeURIComponent(String(id));
  document.cookie = `${CURRENT_ORG_ID_COOKIE_NAME}=${value}; path=/; max-age=${CURRENT_ORG_ID_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function CurrentOrgProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [currentOrganizationId, setCurrentOrganizationId] =
    useState<number | null>(null);

  useEffect(() => {
    setCurrentOrganizationId(getCurrentOrgIdFromCookie());
  }, []);

  const setCurrentOrganizationIdWithCookie = useCallback((id: number | null) => {
    setCurrentOrganizationId(id);
    setCurrentOrgIdCookie(id);
  }, []);

  const value = useMemo<CurrentOrgContextValue>(
    () => ({
      currentOrganizationId,
      setCurrentOrganizationId: setCurrentOrganizationIdWithCookie,
    }),
    [currentOrganizationId, setCurrentOrganizationIdWithCookie]
  );

  return (
    <CurrentOrgContext.Provider value={value}>
      {children}
    </CurrentOrgContext.Provider>
  );
}

export function useCurrentOrg(): CurrentOrgContextValue {
  const context = useContext(CurrentOrgContext);
  if (context === undefined) {
    return defaultValue;
  }
  return context;
}
