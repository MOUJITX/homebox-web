import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PencilIcon,
  TrashIcon,
  PackageIcon,
  CreditCardIcon,
  FileTextIcon,
  FileIcon,
  DownloadIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import type { InvoiceDetail } from "@/api/invoices";
import {
  getInvoiceById,
  uploadInvoiceAttachment,
  deleteInvoiceAttachment,
} from "@/api/invoices";
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
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import AttachmentManager from "@/components/shared/AttachmentManager";
import EditInvoiceDialog from "./EditInvoiceDialog";
import DeleteInvoiceDialog from "./DeleteInvoiceDialog";

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
  readonly onInvoiceChanged?: () => void;
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
  onInvoiceChanged,
}: InvoiceDetailDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceDetail | null>(
    null,
  );
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceDetail | null>(
    null,
  );

  const fetchInvoice = () => {
    if (invoiceId) {
      let cancelled = false;
      getInvoiceById(invoiceId)
        .then(({ data }) => {
          if (!cancelled) setInvoice(data);
        })
        .catch((err) => {
          if (!cancelled)
            setError(getErrorMessage(err) ?? t("invoices.errors.loadFailed"));
        });
      return () => {
        cancelled = true;
      };
    }
  };

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
          if (!cancelled)
            setError(getErrorMessage(err) ?? t("invoices.errors.loadFailed"));
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

  const handleInvoiceChanged = () => {
    fetchInvoice();
    onInvoiceChanged?.();
  };

  const handleAttachmentsChanged = () => {
    fetchInvoice();
    onInvoiceChanged?.();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="shrink-0">
          <SheetTitle>{t("invoices.detail.title")}</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-1 items-center justify-center">
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
              <Field label={t("invoices.form.amount")} value={invoice.amount} />
              <Field
                label={t("invoices.form.taxAmount")}
                value={invoice.taxAmount}
              />
              <Field
                label={t("invoices.form.totalAmount")}
                value={invoice.totalAmount}
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

            <div className="grid gap-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <PackageIcon className="size-4" />
                {t("invoices.detail.boundAssets")}
              </h4>
              {invoice.assets.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("invoices.detail.noBoundAssets")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {invoice.assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        onClose();
                        navigate(`/assets?assetId=${asset.assetId}`);
                      }}
                    >
                      {asset.firstPictureUrl && (
                        <AuthImg
                          url={asset.firstPictureUrl}
                          className="size-5 rounded object-cover"
                        />
                      )}
                      <span className="font-medium">{asset.name}</span>
                      {asset.barcode && (
                        <span className="text-muted-foreground font-mono">
                          {asset.barcode}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {invoice.subscriptions && invoice.subscriptions.length > 0 && (
              <div className="grid gap-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <CreditCardIcon className="size-4" />
                  {t("invoices.detail.boundSubscriptions")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {invoice.subscriptions.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        onClose();
                        navigate(
                          `/subscriptions?subscriptionId=${sub.subscriptionId}`,
                        );
                      }}
                    >
                      {sub.platformLogoUrl ? (
                        <div className="size-5 shrink-0 overflow-hidden rounded">
                          <AuthImg
                            url={sub.platformLogoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <CreditCardIcon className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {sub.subscriptionName}
                      </span>
                      <span className="text-muted-foreground">
                        {sub.platformName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {invoice.visits && invoice.visits.length > 0 && (
              <div className="grid gap-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <FileTextIcon className="size-4" />
                  {t("invoices.detail.boundVisits")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {invoice.visits.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        onClose();
                        navigate(`/medical-records`);
                      }}
                    >
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      <span className="font-medium">{v.patientName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {invoice.previewImage && (
              <div className="grid gap-2">
                <h4 className="text-sm font-medium">
                  {t("invoices.detail.preview")}
                </h4>
                <img
                  src={`data:image/png;base64,${invoice.previewImage}`}
                  alt={t("invoices.detail.preview")}
                  className="w-full rounded border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() =>
                    setPreviewUrl(
                      `data:image/png;base64,${invoice.previewImage}`,
                    )
                  }
                />
              </div>
            )}

            <div className="grid gap-3">
              <h4 className="text-sm font-medium">
                {t("common.attachments")}
              </h4>
              {invoice.fileUrl && (
                <div className="flex items-center gap-3 overflow-hidden rounded-lg border p-2">
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {invoice.invoiceNumber || t("invoices.detail.file")}
                    </p>
                  </div>
                  <a
                    href={invoice.fileUrl}
                    download={
                      invoice.invoiceNumber || t("invoices.detail.file")
                    }
                  >
                    <Button variant="ghost" size="icon-xs">
                      <DownloadIcon className="size-3.5" />
                    </Button>
                  </a>
                </div>
              )}
              <AttachmentManager
                attachments={invoice.attachments.map((a) => ({
                  id: a.id,
                  filename: a.filename,
                  fileSize: a.fileSize,
                  url: a.url,
                }))}
                onUpload={async (file) => {
                  await uploadInvoiceAttachment(invoice.id, file);
                  handleAttachmentsChanged();
                }}
                onDelete={async (id) => {
                  await deleteInvoiceAttachment(invoice.id, id);
                  handleAttachmentsChanged();
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <Field
                label={t("common.createdAt")}
                value={formatDate(invoice.createdAt)}
              />
              <Field
                label={t("common.updatedAt")}
                value={formatDate(invoice.updatedAt)}
              />
            </div>
          </div>
        )}

        {!loading && invoice && (
          <SheetFooter className="shrink-0">
            <Button variant="outline" onClick={() => setEditingInvoice(invoice)}>
              <PencilIcon className="size-3.5" />
              {t("invoices.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeletingInvoice(invoice)}
            >
              <TrashIcon className="size-3.5" />
              {t("invoices.delete")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
      <ImagePreview
        url={previewUrl}
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      />

      <EditInvoiceDialog
        open={!!editingInvoice}
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSuccess={() => {
          setEditingInvoice(null);
          handleInvoiceChanged();
        }}
      />
      <DeleteInvoiceDialog
        open={!!deletingInvoice}
        invoice={deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        onSuccess={() => {
          setDeletingInvoice(null);
          handleInvoiceChanged();
        }}
      />
    </Sheet>
  );
};

export default InvoiceDetailDrawer;
