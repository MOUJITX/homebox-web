import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileTextIcon, PlusIcon, LinkIcon, UnlinkIcon, EyeIcon } from "lucide-react";
import { bindInvoiceToAsset, unbindInvoiceFromAsset } from "@/api/assetInvoices";
import type { InvoiceDetail } from "@/api/invoices";
import { useAssetInvoices } from "@/hooks/queries/useAssetInvoices";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import BindInvoiceDialog from "./BindInvoiceDialog";

interface AssetInvoiceManagerProps {
  readonly assetId: number;
  readonly onInvoiceView: (invoiceId: number) => void;
}

const statusBadgeVariant = (status: string): "success" | "destructive" | "secondary" => {
  switch (status) {
    case "NORMAL": return "success";
    case "VOIDED": return "destructive";
    case "RED_FLUSHED": return "secondary";
    default: return "secondary";
  }
};

const AssetInvoiceManager = ({ assetId, onInvoiceView }: AssetInvoiceManagerProps) => {
  const { t } = useTranslation();
  const { data: invoices = [], isLoading } = useAssetInvoices(assetId);
  const invalidate = useInvalidateAssets();
  const [createOpen, setCreateOpen] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);

  const handleUnbind = async (invoiceId: number) => {
    await unbindInvoiceFromAsset(assetId, invoiceId);
    void invalidate.invalidateInvoices(assetId);
  };

  const handleCreated = async (invoice: InvoiceDetail) => {
    await bindInvoiceToAsset(assetId, invoice.id);
    void invalidate.invalidateInvoices(assetId);
  };

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <FileTextIcon className="size-4" />
          {t("assets.invoices.title")}
        </h4>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setBindOpen(true)}>
            <LinkIcon className="size-3.5" />
            {t("assets.invoices.bind")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("assets.invoices.uploadNew")}
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-4">{t("common.loading")}</p>
      )}

      {!isLoading && invoices.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("assets.invoices.empty")}
        </p>
      )}

      {!isLoading && invoices.length > 0 && (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="font-mono text-xs hover:underline cursor-pointer truncate"
                  onClick={() => onInvoiceView(inv.invoiceId)}
                >
                  {inv.invoiceNumber || `#${inv.invoiceId}`}
                </button>
                {inv.invoiceDate && (
                  <span className="text-muted-foreground text-xs">
                    {formatDate(inv.invoiceDate)}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {t(`invoices.type.${inv.invoiceType}`)}
                </Badge>
                <Badge variant={statusBadgeVariant(inv.invoiceStatus)} className="text-xs">
                  {t(`invoices.status.${inv.invoiceStatus}`)}
                </Badge>
                {inv.totalAmount != null && (
                  <span className="text-xs font-medium">{formatCurrency(inv.totalAmount)}</span>
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
        onSuccess={() => { /* no-op, we use onCreated */ }}
        onCreated={handleCreated}
      />
      <BindInvoiceDialog
        assetId={assetId}
        boundInvoiceIds={invoices.map((i) => i.invoiceId)}
        open={bindOpen}
        onClose={() => setBindOpen(false)}
        onSuccess={() => void invalidate.invalidateInvoices(assetId)}
      />
    </div>
  );
};

export default AssetInvoiceManager;
