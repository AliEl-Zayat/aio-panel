"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { inventoryService, type Product } from "@/services/inventory.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SegmentControl } from "@/components/ui/segment-control";
import { Plus } from "lucide-react";

const PRODUCTS_QUERY_KEY = ["inventory", "products"] as const;
const STORAGE_VIEW_KEY = "inventory-products-view";

export type InventoryViewMode = "table" | "cards";

function isLowStock(product: Product): boolean {
  const threshold = product.lowStockThreshold;
  if (threshold == null) return false;
  return product.quantity <= threshold;
}

function formatUnitPrice(product: Product): string {
  if (product.unitPrice == null) return "—";
  if (product.currency) {
    return `${product.currency} ${product.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  return product.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function useInventoryView(): [InventoryViewMode, (v: InventoryViewMode) => void] {
  const [view, setViewState] = useState<InventoryViewMode>("table");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_VIEW_KEY);
    if (raw === "table" || raw === "cards") setViewState(raw);
  }, []);
  const setView = useCallback((v: InventoryViewMode) => {
    setViewState(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_VIEW_KEY, v);
  }, []);
  return [view, setView];
}

export function ProductsList() {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [view, setView] = useInventoryView();

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, lowStockOnly],
    queryFn: () =>
      inventoryService.getProducts({ lowStock: lowStockOnly || undefined }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
        {view === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-24 w-full rounded-md" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium p-4">{t("name")}</th>
                      <th className="text-left font-medium p-4">{t("sku")}</th>
                      <th className="text-left font-medium p-4">{t("unit")}</th>
                      <th className="text-right font-medium p-4">{t("unitPrice")}</th>
                      <th className="text-right font-medium p-4">
                        {t("currentStock")}
                      </th>
                      <th className="text-right font-medium p-4">{tCommon("actions")}</th>
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
                          <Skeleton className="h-5 w-12 ml-auto" />
                        </td>
                        <td className="p-4 text-right">
                          <Skeleton className="h-5 w-12 ml-auto" />
                        </td>
                        <td className="p-4" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : t("errorLoad")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {tCommon("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SegmentControl
            value={view}
            options={[
              { value: "table", label: t("viewTable") },
              { value: "cards", label: t("viewCards") },
            ]}
            onValueChange={(v) => setView(v === "cards" ? "cards" : "table")}
            aria-label={t("viewMode")}
          />
          <Button asChild>
            <Link href="/dashboard/inventory/new">
              <Plus className="size-4" />
              {t("addProduct")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("emptyProducts")}</p>
            <Button asChild>
              <Link href="/dashboard/inventory/new">
                <Plus className="size-4" />
                {t("addProduct")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SegmentControl
          value={view}
          options={[
            { value: "table", label: t("viewTable") },
            { value: "cards", label: t("viewCards") },
          ]}
          onValueChange={(v) => setView(v === "cards" ? "cards" : "table")}
          aria-label={t("viewMode")}
        />
        <Button
          variant={lowStockOnly ? "secondary" : "outline"}
          size="sm"
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          {t("filterLowStock")}
        </Button>
        <Button asChild>
          <Link href="/dashboard/inventory/new">
            <Plus className="size-4" />
            {t("addProduct")}
          </Link>
        </Button>
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-colors hover:bg-muted/30"
            >
              <Link href={`/dashboard/inventory/${product.id}`} className="block">
                <CardContent className="p-0">
                  {product.imageUrl ? (
                    <div className="aspect-video w-full bg-muted">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      {product.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      {isLowStock(product) && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs"
                          title={t("lowStock")}
                        >
                          {t("lowStock")}
                        </Badge>
                      )}
                    </div>
                    {product.sku && (
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="text-muted-foreground">
                        {product.unit}
                      </span>
                      <span className="tabular-nums font-medium">
                        {t("currentStock")}: {product.quantity}
                      </span>
                    </div>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {formatUnitPrice(product)}
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4">{t("name")}</th>
                    <th className="text-left font-medium p-4">{t("sku")}</th>
                    <th className="text-left font-medium p-4">{t("unit")}</th>
                    <th className="text-right font-medium p-4">{t("unitPrice")}</th>
                    <th className="text-right font-medium p-4">
                      {t("currentStock")}
                    </th>
                    <th className="text-right font-medium p-4" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <Link
                          href={`/dashboard/inventory/${product.id}`}
                          className="font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {product.sku ?? "—"}
                      </td>
                      <td className="p-4">{product.unit}</td>
                      <td className="p-4 text-right tabular-nums">
                        {formatUnitPrice(product)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="tabular-nums">{product.quantity}</span>
                        {isLowStock(product) && (
                          <Badge
                            variant="secondary"
                            className="ms-2 text-xs"
                            title={t("lowStock")}
                          >
                            {t("lowStock")}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/inventory/${product.id}`}>
                            {tCommon("actions")}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
