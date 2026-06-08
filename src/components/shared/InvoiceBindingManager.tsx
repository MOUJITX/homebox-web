import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileTextIcon, LinkIcon, EyeIcon, UnlinkIcon } from "lucide-react";
import type { InvoiceDetail } from "@/api/invoices";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import BindInvoiceDialog from "./BindInvoiceDialog";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import InvoiceDetailDrawer from "@/components/invoices/InvoiceDetailDrawer";

export interface BoundInvoice {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: number | null;
}

interface InvoiceBindingManagerProps {
  readonly invoices: BoundInvoice[];
  readonly title: string;
  readonly emptyLabel: string;
  readonly bindLabel: string;
  readonly onBindInvoice: (invoiceId: number) => Promise<void>;
  readonly boundInvoiceIds?: number[];
  readonly uploadNewLabel: string;
  readonly onCreateInvoice: (invoice: InvoiceDetail) => Promise<void>;
  readonly onUnbind: (id: number) => Promise<void>;
  readonly onView?: (invoiceId: number) => void;
  readonly onInvoiceChanged?: () => void;
}

const InvoiceBindingManager = ({
  invoices,
  title,
  emptyLabel,
  bindLabel,
  onBindInvoice,
  boundInvoiceIds,
  uploadNewLabel,
  onCreateInvoice,
  onUnbind,
  onView,
  onInvoiceChanged,
}: InvoiceBindingManagerProps) => {
  const { t } = useTranslation();
  const [unbinding, setUnbinding] = useState<number | null>(null);
  const [bindOpen, setBindOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleUnbind = async (id: number) => {
    setUnbinding(id);
    try {
      await onUnbind(id);
    } finally {
      setUnbinding(null);
    }
  };

  const handleView = (invoiceId: number) => {
    if (onView) {
      onView(invoiceId);
    } else {
      setViewInvoiceId(invoiceId);
      setDrawerOpen(true);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <FileTextIcon className="size-4" />
          {title}
        </h4>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setBindOpen(true)}>
            <LinkIcon className="size-3.5" />
            {bindLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            {uploadNewLabel}
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
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
                  {inv.invoiceNumber ?? `#${inv.invoiceId}`}
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
                  onClick={() => handleView(inv.invoiceId)}
                  title="View"
                >
                  <EyeIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={unbinding === inv.id}
                  onClick={() => void handleUnbind(inv.id)}
                  title="Unbind"
                >
                  <UnlinkIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BindInvoiceDialog
        open={bindOpen}
        onClose={() => setBindOpen(false)}
        onBind={onBindInvoice}
        onCreateNew={() => setCreateOpen(true)}
        boundInvoiceIds={boundInvoiceIds}
        title={t("shared.invoices.bindDialog.title")}
        searchPlaceholder={t("shared.invoices.bindDialog.search")}
        confirmLabel={t("shared.invoices.bindDialog.confirm")}
        uploadNewLabel={uploadNewLabel}
      />

      <CreateInvoiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onCreateInvoice}
      />

      <InvoiceDetailDrawer
        invoiceId={viewInvoiceId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setViewInvoiceId(null);
        }}
        onInvoiceChanged={onInvoiceChanged}
      />
    </div>
  );
};

export default InvoiceBindingManager;
