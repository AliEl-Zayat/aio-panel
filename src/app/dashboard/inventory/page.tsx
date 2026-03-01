import { getTranslations } from "next-intl/server";
import { ProductsList } from "@/components/inventory/products-list";

export default async function InventoryPage() {
  const t = await getTranslations("inventory");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <ProductsList />
    </div>
  );
}
