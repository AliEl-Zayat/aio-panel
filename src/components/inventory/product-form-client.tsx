"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "./product-form";
import { Card, CardContent } from "@/components/ui/card";

const PRODUCTS_QUERY_KEY = ["inventory", "products"] as const;

export function ProductFormClient({
  mode,
}: Readonly<{ mode: "create" }>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardContent className="pt-6">
        <ProductForm
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
            router.push("/dashboard/inventory");
          }}
          onCancel={() => router.push("/dashboard/inventory")}
        />
      </CardContent>
    </Card>
  );
}
