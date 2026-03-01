"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService, type Product } from "@/services/inventory.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ProductForm } from "./product-form";
import { RecordMovementForm } from "./record-movement-form";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

const PRODUCT_QUERY_KEY = (id: number) =>
  ["inventory", "product", id] as const;
const MOVEMENTS_QUERY_KEY = (id: number) =>
  ["inventory", "product", id, "movements"] as const;

export function ProductDetail({ productId }: { productId: number }) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [recordMovementOpen, setRecordMovementOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: PRODUCT_QUERY_KEY(productId),
    queryFn: () => inventoryService.getProduct(productId),
  });

  const { data: movements = [] } = useQuery({
    queryKey: MOVEMENTS_QUERY_KEY(productId),
    queryFn: () => inventoryService.getMovements(productId),
    enabled: product != null,
  });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await inventoryService.deleteProduct(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
      setDeleteTarget(null);
      window.location.href = "/dashboard/inventory";
    } catch {
      setIsDeleting(false);
    }
  }

  const isLowStock =
    product != null &&
    product.lowStockThreshold != null &&
    product.quantity <= product.lowStockThreshold;

  if (isLoading || product == null) {
    if (isError) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
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
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-16 w-16 rounded-md object-cover border"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              {product.sku && (
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecordMovementOpen(true)}
              aria-label={t("recordMovement")}
            >
              <Plus className="size-4" />
              {t("recordMovement")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              aria-label={t("editProduct")}
            >
              <Pencil className="size-4" />
              {t("editProduct")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(product)}
              aria-label={t("deleteProduct")}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              {t("deleteProduct")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("unit")}:</span>{" "}
              {product.unit}
            </p>
            {product.unitPrice != null && (
              <p>
                <span className="text-muted-foreground">
                  {t("unitPrice")}:
                </span>{" "}
                <span className="tabular-nums font-medium">
                  {product.currency
                    ? `${product.currency} ${product.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : product.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">
                {t("currentStock")}:
              </span>{" "}
              <span className="tabular-nums font-medium">{product.quantity}</span>
              {isLowStock && (
                <Badge variant="secondary" className="ms-2">
                  {t("lowStock")}
                </Badge>
              )}
            </p>
            {product.description && (
              <p>
                <span className="text-muted-foreground">
                  {t("description")}:
                </span>{" "}
                {product.description}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">{t("movements")}</h4>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No movements yet. Record a purchase or adjustment.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {movements.slice(0, 20).map((m) => (
                  <li
                    key={m.id}
                    className="flex justify-between gap-4 py-1 border-b last:border-0"
                  >
                    <span>
                      {new Date(m.createdAt).toLocaleDateString()} — {m.type}{" "}
                      {m.quantityDelta > 0 ? "+" : ""}
                      {m.quantityDelta}
                    </span>
                    {m.note && (
                      <span className="text-muted-foreground truncate max-w-[200px]">
                        {m.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={recordMovementOpen} onOpenChange={setRecordMovementOpen}>
        <DialogContent className="overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t("recordMovement")}</DialogTitle>
          </DialogHeader>
          <RecordMovementForm
            productId={productId}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: PRODUCT_QUERY_KEY(productId),
              });
              queryClient.invalidateQueries({
                queryKey: MOVEMENTS_QUERY_KEY(productId),
              });
              setRecordMovementOpen(false);
            }}
            onCancel={() => setRecordMovementOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t("editProduct")}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={product}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: PRODUCT_QUERY_KEY(productId),
              });
              queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
              setEditOpen(false);
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteProduct")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteProduct")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("deleteProduct")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
