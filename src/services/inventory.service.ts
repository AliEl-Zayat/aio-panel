import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";

export type StockMovementType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN";

export interface Product {
  id: number;
  userId: number;
  name: string;
  sku: string | null;
  description: string | null;
  imageUrl: string | null;
  unit: string;
  unitPrice: number | null;
  densityGPerCm3: number | null;
  currency: string | null;
  lowStockThreshold: number | null;
  createdAt: string;
  updatedAt: string;
  quantity: number;
}

export interface StockMovement {
  id: number;
  productId: number;
  quantityDelta: number;
  type: StockMovementType;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdAt: string;
  userId: number;
}

export interface CreateProductBody {
  name: string;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  unit: string;
  unitPrice?: number | null;
  densityGPerCm3?: number | null;
  currency?: string | null;
  lowStockThreshold?: number | null;
}

export interface UpdateProductBody {
  name?: string;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  unit?: string;
  unitPrice?: number | null;
  densityGPerCm3?: number | null;
  currency?: string | null;
  lowStockThreshold?: number | null;
}

export interface CreateMovementBody {
  quantityDelta: number;
  type: StockMovementType;
  note?: string | null;
}

export interface GetProductsParams {
  search?: string;
  lowStock?: boolean;
}

export interface GetMovementsParams {
  limit?: number;
  offset?: number;
}

export const inventoryService = {
  async getProducts(params?: GetProductsParams): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.search?.trim()) searchParams.set("search", params.search.trim());
    if (params?.lowStock === true) searchParams.set("lowStock", "true");
    const query = searchParams.toString();
    const url = query
      ? `${ApiUrlConstants.INVENTORY_PRODUCTS}?${query}`
      : ApiUrlConstants.INVENTORY_PRODUCTS;
    const { data } = await apiClient.get<Product[]>(url);
    return data;
  },

  async getProduct(id: number): Promise<Product> {
    const { data } = await apiClient.get<Product>(
      ApiUrlConstants.INVENTORY_PRODUCT_BY_ID(id)
    );
    return data;
  },

  async createProduct(body: CreateProductBody): Promise<Product> {
    const { data } = await apiClient.post<Product>(
      ApiUrlConstants.INVENTORY_PRODUCTS,
      body
    );
    return data;
  },

  async updateProduct(
    id: number,
    body: UpdateProductBody
  ): Promise<Product> {
    const { data } = await apiClient.patch<Product>(
      ApiUrlConstants.INVENTORY_PRODUCT_BY_ID(id),
      body
    );
    return data;
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.INVENTORY_PRODUCT_BY_ID(id));
  },

  async uploadProductImage(id: number, file: File): Promise<Product> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<Product>(
      ApiUrlConstants.INVENTORY_PRODUCT_UPLOAD_IMAGE(id),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  async getMovements(
    productId: number,
    params?: GetMovementsParams
  ): Promise<StockMovement[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit != null) searchParams.set("limit", String(params.limit));
    if (params?.offset != null)
      searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    const url = query
      ? `${ApiUrlConstants.INVENTORY_PRODUCT_MOVEMENTS(productId)}?${query}`
      : ApiUrlConstants.INVENTORY_PRODUCT_MOVEMENTS(productId);
    const { data } = await apiClient.get<StockMovement[]>(url);
    return data;
  },

  async createMovement(
    productId: number,
    body: CreateMovementBody
  ): Promise<StockMovement> {
    const { data } = await apiClient.post<StockMovement>(
      ApiUrlConstants.INVENTORY_PRODUCT_MOVEMENTS(productId),
      body
    );
    return data;
  },
};
