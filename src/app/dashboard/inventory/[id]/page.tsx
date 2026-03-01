import { getTranslations } from "next-intl/server";
import { ProductDetail } from "@/components/inventory/product-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("inventory");
  const productId = parseInt(id, 10);
  if (Number.isNaN(productId) || productId < 1) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">{t("errorLoad")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <ProductDetail productId={productId} />
    </div>
  );
}
