import { InvoiceFormClient } from "@/components/invoices/invoice-form-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params;
  const invoiceId = Number.parseInt(id, 10);
  if (Number.isNaN(invoiceId) || invoiceId < 1) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Invalid invoice.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">Edit invoice</h2>
      <InvoiceFormClient mode="edit" invoiceId={invoiceId} />
    </div>
  );
}
