import { getTranslations } from "next-intl/server";
import { ProductFormClient } from "@/components/inventory/product-form-client";

export default async function NewProductPage() {
  const t = await getTranslations("inventory");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("addProduct")}</h2>
      <ProductFormClient mode="create" />
    </div>
  );
}
