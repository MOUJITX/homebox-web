import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileTextIcon, PlusIcon, LinkIcon, UnlinkIcon, EyeIcon } from "lucide-react";
import type { SubscriptionRecordInvoice } from "@/api/subscriptions";
import { bindInvoice, unbindInvoice } from "@/api/subscriptionRecords";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import BindSubscriptionInvoiceDialog from "./BindSubscriptionInvoiceDialog";

interface SubscriptionInvoiceManagerProps {
  readonly recordId: number;
  readonly invoices: SubscriptionRecordInvoice[];
  readonly onChanged: () => void;
  readonly onInvoiceView: (invoiceId: number) => void;
}

const SubscriptionInvoiceManager = ({
  recordId,
  invoices,
  onChanged,
  onInvoiceView,
}: SubscriptionInvoiceManagerProps) => {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);

  const handleUnbind = async (invoiceId: number) => {
    await unbindInvoice(recordId, invoiceId);
    onChanged();
  };

  const handleCreated = async (invoice: { id: number }) => {
    await bindInvoice(recordId, invoice.id);
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <FileTextIcon className="size-4" />
          {t("subscriptions.invoices.bind")}
        </h4>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setBindOpen(true)}>
            <LinkIcon className="size-3.5" />
            {t("subscriptions.invoices.bind")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("subscriptions.invoices.uploadNew")}
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("common.noResults")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {inv.invoiceDate && (
                  <span className="text-muted-foreground text-xs">
                    {formatDate(inv.invoiceDate)}
                  </span>
                )}
                <span className="font-mono text-xs">
                  {inv.sellerName ?? `Invoice ${inv.invoiceNumber ?? ""}`}
                </span>
                {inv.totalAmount != null && (
                  <span className="text-xs font-medium">
                    {formatCurrency(inv.totalAmount)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onInvoiceView(inv.invoiceId)}
                >
                  <EyeIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => void handleUnbind(inv.invoiceId)}
                >
                  <UnlinkIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateInvoiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {}}
        onCreated={handleCreated}
      />
      <BindSubscriptionInvoiceDialog
        recordId={recordId}
        boundInvoiceIds={invoices.map((i) => i.invoiceId)}
        open={bindOpen}
        onClose={() => setBindOpen(false)}
        onSuccess={() => onChanged()}
      />
    </div>
  );
};

export default SubscriptionInvoiceManager;
