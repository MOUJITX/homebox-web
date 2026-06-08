import { useTranslation } from "react-i18next";
import type { SubscriptionRecordInvoice } from "@/api/subscriptions";
import { bindInvoice, unbindInvoice } from "@/api/subscriptionRecords";
import InvoiceBindingManager, {
  type BoundInvoice,
} from "@/components/shared/InvoiceBindingManager";

interface SubscriptionInvoiceManagerProps {
  readonly recordId: number;
  readonly invoices: SubscriptionRecordInvoice[];
  readonly onChanged: () => void;
  readonly onInvoiceView?: (invoiceId: number) => void;
}

const SubscriptionInvoiceManager = ({
  recordId,
  invoices,
  onChanged,
  onInvoiceView,
}: SubscriptionInvoiceManagerProps) => {
  const { t } = useTranslation();

  return (
    <InvoiceBindingManager
      invoices={invoices.map(
        (inv) =>
          ({
            id: inv.id,
            invoiceId: inv.invoiceId,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            totalAmount: inv.totalAmount,
            sellerName: inv.sellerName,
          }) satisfies BoundInvoice,
      )}
      title={t("subscriptions.invoices.bind")}
      emptyLabel={t("common.noResults")}
      bindLabel={t("subscriptions.invoices.bind")}
      onBindInvoice={async (invoiceId) => {
        await bindInvoice(recordId, invoiceId);
        onChanged();
      }}
      boundInvoiceIds={invoices.map((i) => i.invoiceId)}
      uploadNewLabel={t("common.uploadNew")}
      onCreateInvoice={async (invoice) => {
        await bindInvoice(recordId, invoice.id);
        onChanged();
      }}
      onUnbind={async (id) => {
        // The subscription API expects the actual invoice ID, not the binding relationship ID
        const inv = invoices.find((i) => i.id === id);
        if (inv) {
          await unbindInvoice(recordId, inv.invoiceId);
          onChanged();
        }
      }}
      onView={onInvoiceView}
    />
  );
};

export default SubscriptionInvoiceManager;
