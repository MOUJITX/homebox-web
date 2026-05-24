import { useState } from "react";
import { LinkIcon, EyeIcon, UnlinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";

export interface BoundInvoice {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  sellerName?: string | null;
  invoiceType?: string;
  totalAmount: number | null;
}

interface Props {
  invoices: BoundInvoice[];
  title: string;
  bindLabel: string;
  uploadNewLabel: string;
  emptyLabel: string;
  onBind: () => void;
  onCreateNew: () => void;
  onUnbind: (id: number) => Promise<void>;
  onView?: (invoiceId: number) => void;
}

const InvoiceBindingManager = ({
  invoices, title, bindLabel, uploadNewLabel, emptyLabel,
  onBind, onCreateNew, onUnbind, onView,
}: Props) => {
  const [unbinding, setUnbinding] = useState<number | null>(null);

  const handleUnbind = async (id: number) => {
    setUnbinding(id);
    try { await onUnbind(id); }
    finally { setUnbinding(null); }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">{title}</h4>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onBind}>
            <LinkIcon className="size-3.5" />
            {bindLabel}
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateNew}>
            {uploadNewLabel}
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                {inv.invoiceDate && <span className="text-muted-foreground text-xs">{formatDate(inv.invoiceDate)}</span>}
                <span className="font-mono text-xs">{inv.invoiceNumber ?? `#${inv.invoiceId}`}</span>
                {inv.totalAmount != null && <span className="text-xs font-medium">{formatCurrency(inv.totalAmount)}</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onView && (
                  <Button variant="ghost" size="icon-xs" onClick={() => onView(inv.invoiceId)}>
                    <EyeIcon className="size-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-xs" disabled={unbinding === inv.id} onClick={() => handleUnbind(inv.id)}>
                  <UnlinkIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceBindingManager;
