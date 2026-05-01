import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, DownloadIcon, EyeIcon } from "lucide-react";
import type { InvoiceDetail } from "@/api/invoices";
import { getInvoiceById } from "@/api/invoices";
import { downloadAuthFile } from "@/hooks/useAuthImage";
import { getErrorMessage } from "@/lib/error";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import InvoiceAttachmentManager from "./InvoiceAttachmentManager";

const Field = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="grid gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

interface InvoiceDetailDrawerProps {
  readonly invoiceId: number | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onEdit: (invoice: InvoiceDetail) => void;
  readonly onDelete: (invoice: InvoiceDetail) => void;
  readonly onRefresh: () => void;
}

const statusBadgeVariant = (
  status: string,
): "success" | "destructive" | "secondary" => {
  switch (status) {
    case "NORMAL":
      return "success";
    case "VOIDED":
      return "destructive";
    case "RED_FLUSHED":
      return "secondary";
    default:
      return "secondary";
  }
};

const InvoiceDetailDrawer = ({
  invoiceId,
  open,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
}: InvoiceDetailDrawerProps) => {
  const { t } = useTranslation();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && invoiceId) {
      let cancelled = false;
      setLoading(true);
      setError("");
      getInvoiceById(invoiceId)
        .then(({ data }) => {
          if (!cancelled) setInvoice(data);
        })
        .catch((err) => {
          if (!cancelled) setError(getErrorMessage(err) ?? t("invoices.errors.loadFailed"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setInvoice(null);
      setError("");
    }
  }, [open, invoiceId]);

  const handleAttachmentsChanged = () => {
    if (invoiceId) {
      let cancelled = false;
      getInvoiceById(invoiceId)
        .then(({ data }) => {
          if (!cancelled) setInvoice(data);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
    onRefresh();
  };

  const handlePreview = () => {
    if (invoice?.fileUrl) {
      window.open(invoice.fileUrl, "_blank");
    }
  };

  const handleDownload = () => {
    if (invoice?.fileUrl && invoice.invoiceNumber) {
      downloadAuthFile(
        invoice.fileUrl.replace("/preview", "/download"),
        invoice.invoiceNumber,
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("invoices.detail.title")}</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {!loading && invoice && (
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4">
            <div className="flex items-center gap-2">
              <Badge variant={statusBadgeVariant(invoice.invoiceStatus)}>
                {t(`invoices.status.${invoice.invoiceStatus}`)}
              </Badge>
              <Badge variant="outline">
                {t(`invoices.type.${invoice.invoiceType}`)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("invoices.form.invoiceNumber")}
                value={invoice.invoiceNumber}
              />
              <Field
                label={t("invoices.form.invoiceDate")}
                value={
                  invoice.invoiceDate ? formatDate(invoice.invoiceDate) : null
                }
              />
              <Field
                label={t("invoices.form.totalAmount")}
                value={invoice.totalAmount}
              />
              <Field label={t("invoices.form.amount")} value={invoice.amount} />
              <Field
                label={t("invoices.form.taxAmount")}
                value={invoice.taxAmount}
              />
            </div>

            <div className="grid gap-4">
              <h4 className="text-sm font-medium">
                {t("invoices.detail.buyerInfo")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label={t("invoices.form.buyerName")}
                  value={invoice.buyerName}
                />
                <Field
                  label={t("invoices.form.buyerTaxId")}
                  value={invoice.buyerTaxId}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <h4 className="text-sm font-medium">
                {t("invoices.detail.sellerInfo")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label={t("invoices.form.sellerName")}
                  value={invoice.sellerName}
                />
                <Field
                  label={t("invoices.form.sellerTaxId")}
                  value={invoice.sellerTaxId}
                />
              </div>
            </div>

            {invoice.remark && (
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">
                  {t("invoices.form.remark")}
                </span>
                <span className="text-sm whitespace-pre-wrap">
                  {invoice.remark}
                </span>
              </div>
            )}

            {invoice.fileUrl && (
              <div className="grid gap-2">
                <h4 className="text-sm font-medium">
                  {t("invoices.detail.file")}
                </h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePreview}>
                    <EyeIcon className="size-3.5" />
                    {t("invoices.detail.preview")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <DownloadIcon className="size-3.5" />
                    {t("invoices.detail.download")}
                  </Button>
                </div>
              </div>
            )}

            <InvoiceAttachmentManager
              invoiceId={invoice.id}
              attachments={invoice.attachments}
              onChanged={handleAttachmentsChanged}
            />

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <Field
                label={t("invoices.detail.createdAt")}
                value={formatDate(invoice.createdAt)}
              />
              <Field
                label={t("invoices.detail.updatedAt")}
                value={formatDate(invoice.updatedAt)}
              />
            </div>
          </div>
        )}

        {!loading && invoice && (
          <SheetFooter>
            <Button variant="outline" onClick={() => onEdit(invoice)}>
              <PencilIcon className="size-3.5" />
              {t("invoices.edit")}
            </Button>
            <Button variant="destructive" onClick={() => onDelete(invoice)}>
              <TrashIcon className="size-3.5" />
              {t("invoices.delete")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default InvoiceDetailDrawer;
