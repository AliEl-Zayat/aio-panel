import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID";

export type InvoiceDirection = "OUTGOING" | "INCOMING";

export interface InvoiceLineItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  productId: number | null;
}

export interface InvoicePayment {
  id: number;
  invoiceId: number;
  amount: number;
  paidAt: string;
  note: string | null;
  createdAt: string;
}

export interface Invoice {
  id: number;
  userId: number;
  direction: InvoiceDirection;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  notes: string | null;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  total: number;
  paidTotal: number;
  amountDue: number;
  overdue: boolean;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  productId?: number | null;
}

export interface CreateInvoiceBody {
  direction?: InvoiceDirection;
  clientName: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  dueDate?: string | null;
  currency: string;
  notes?: string | null;
  discountAmount?: number;
  lineItems: InvoiceLineItemInput[];
}

export interface UpdateInvoiceBody {
  direction?: InvoiceDirection;
  clientName?: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  dueDate?: string | null;
  currency?: string;
  notes?: string | null;
  discountAmount?: number;
  lineItems?: InvoiceLineItemInput[];
}

export interface AddPaymentBody {
  amount: number;
  paidAt: string;
  note?: string | null;
}

export interface GetInvoicesParams {
  status?: InvoiceStatus;
  from?: string;
  to?: string;
}

export type ClientSuggestion =
  | { type: "person"; id: number; name: string; email?: string; phone?: string; address?: string }
  | { type: "company"; id: number; name: string };

export const invoicesService = {
  async getClientSuggestions(q: string): Promise<{ suggestions: ClientSuggestion[] }> {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const url = params.toString()
      ? `${ApiUrlConstants.INVOICE_CLIENT_SUGGESTIONS}?${params.toString()}`
      : ApiUrlConstants.INVOICE_CLIENT_SUGGESTIONS;
    const { data } = await apiClient.get<{ suggestions: ClientSuggestion[] }>(url);
    return data;
  },

  async getInvoices(params?: GetInvoicesParams): Promise<Invoice[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    const url = query
      ? `${ApiUrlConstants.INVOICES}?${query}`
      : ApiUrlConstants.INVOICES;
    const { data } = await apiClient.get<Invoice[]>(url);
    return data;
  },

  async getInvoice(id: number): Promise<Invoice> {
    const { data } = await apiClient.get<Invoice>(
      ApiUrlConstants.INVOICE_BY_ID(id)
    );
    return data;
  },

  async createInvoice(body: CreateInvoiceBody): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(
      ApiUrlConstants.INVOICES,
      body
    );
    return data;
  },

  async updateInvoice(id: number, body: UpdateInvoiceBody): Promise<Invoice> {
    const { data } = await apiClient.patch<Invoice>(
      ApiUrlConstants.INVOICE_BY_ID(id),
      body
    );
    return data;
  },

  async deleteInvoice(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.INVOICE_BY_ID(id));
  },

  async markSent(id: number): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(
      ApiUrlConstants.INVOICE_MARK_SENT(id)
    );
    return data;
  },

  async markPaid(id: number): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(
      ApiUrlConstants.INVOICE_MARK_PAID(id)
    );
    return data;
  },

  async getPayments(id: number): Promise<InvoicePayment[]> {
    const { data } = await apiClient.get<InvoicePayment[]>(
      ApiUrlConstants.INVOICE_PAYMENTS(id)
    );
    return data;
  },

  async addPayment(id: number, body: AddPaymentBody): Promise<InvoicePayment> {
    const { data } = await apiClient.post<InvoicePayment>(
      ApiUrlConstants.INVOICE_PAYMENTS(id),
      body
    );
    return data;
  },
};
