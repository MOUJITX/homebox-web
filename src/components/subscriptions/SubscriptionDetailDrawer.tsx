import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";
import { useSubscriptionDetail } from "@/hooks/queries/useSubscriptionDetail";
import { useInvalidateSubscriptions } from "@/hooks/queries/useInvalidateSubscriptions";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import AuthImg from "@/components/AuthImg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import SubscriptionDialog from "./SubscriptionDialog";
import SubscriptionRecordDialog from "./SubscriptionRecordDialog";
import DeleteSubscriptionDialog from "./DeleteSubscriptionDialog";
import InvoiceDetailDrawer from "@/components/invoices/InvoiceDetailDrawer";

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

const statusBadgeVariant = (
  status: string,
): "success" | "secondary" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "secondary";
    case "CANCELLED":
      return "outline";
    default:
      return "secondary";
  }
};

interface SubscriptionDetailDrawerProps {
  readonly subscriptionId: number | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

const SubscriptionDetailDrawer = ({
  subscriptionId,
  open,
  onClose,
}: SubscriptionDetailDrawerProps) => {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useSubscriptionDetail(subscriptionId);
  const invalidate = useInvalidateSubscriptions();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [invoiceDrawerId, setInvoiceDrawerId] = useState<number | null>(null);

  const handleRecordChanged = () => {
    if (subscriptionId) {
      invalidate.invalidateRecords(subscriptionId);
      invalidate.invalidateDetail(subscriptionId);
    }
  };

  if (!detail && !isLoading) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{detail?.name ?? t("common.loading")}</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        )}

        {detail && (
          <div className="mt-6 space-y-6">
            {/* Subscription Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant(detail.status)}>
                  {t(`subscriptions.status.${detail.status.toLowerCase()}`)}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                {detail.platformLogoUrl ? (
                  <div className="size-8 shrink-0 overflow-hidden rounded">
                    <AuthImg
                      url={detail.platformLogoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-8 shrink-0 rounded bg-muted" />
                )}
                <div>
                  <span className="text-sm font-medium">
                    {detail.platformName}
                  </span>
                  {detail.platformWebsite && (
                    <a
                      href={detail.platformWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-primary hover:underline"
                    >
                      {detail.platformWebsite}
                    </a>
                  )}
                </div>
              </div>

              {detail.description && (
                <Field
                  label={t("subscriptions.form.description")}
                  value={detail.description}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={t("subscriptions.form.subscriptionType")}
                  value={t(
                    `subscriptions.types.${detail.subscriptionType === "PAY_AS_YOU_GO" ? "payAsYouGo" : "periodic"}`,
                  )}
                />
                {detail.subscriptionType === "PAY_AS_YOU_GO" &&
                  detail.billingMode && (
                    <Field
                      label={t("subscriptions.form.billingMode")}
                      value={t(
                        `subscriptions.billingModes.${detail.billingMode === "PREPAID" ? "prepaid" : "postpaid"}`,
                      )}
                    />
                  )}
                {detail.subscriptionType === "PERIODIC" && (
                  <Field
                    label={t("subscriptions.form.renewNoticeDays")}
                    value={`${detail.renewNoticeDays} ${t("subscriptions.billingCycles.daysUnit")}`}
                  />
                )}
              </div>

              {detail.note && (
                <Field
                  label={t("subscriptions.form.note")}
                  value={detail.note}
                />
              )}
            </div>

            {/* Records */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">
                  {t("subscriptions.detail.records")}
                </h4>
                <Button size="sm" onClick={() => setRecordDialogOpen(true)}>
                  <PlusIcon className="size-3.5" />
                  {t("subscriptions.addRecord")}
                </Button>
              </div>

              {detail.records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("subscriptions.detail.noRecords")}
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.records.map((rec) => {
                    const today = new Date().toISOString().slice(0, 10);
                    const isExpired = rec.endDate && rec.endDate <= today;

                    return (
                    <div
                      key={rec.id}
                      className={cn(
                        "relative overflow-hidden rounded-lg border p-3 text-sm space-y-2",
                        isExpired && "opacity-60 bg-muted/30"
                      )}
                    >
                      {isExpired && (
                        <div className="absolute -left-5 top-2 w-16 -rotate-45 bg-muted-foreground/20 text-center text-[10px] leading-5 text-muted-foreground pl-1.5">
                          {t("subscriptions.records.expired")}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(rec.recordDate)}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(rec.amount)} {rec.currency}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {rec.paymentMethodName && (
                          <span className="flex items-center gap-1">
                            {rec.paymentMethodLogoUrl && (
                              <AuthImg
                                url={rec.paymentMethodLogoUrl}
                                alt=""
                                className="size-4 shrink-0 rounded object-cover"
                              />
                            )}
                            {rec.paymentMethodName}
                          </span>
                        )}
                        {rec.orderNo && (
                          <span>
                            {t("subscriptions.records.orderNo")}: {rec.orderNo}
                          </span>
                        )}
                        {rec.quantity && <span>{rec.quantity}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <span>
                          {t("subscriptions.records.startDate")}:{" "}
                          {formatDate(rec.startDate)}
                        </span>
                        {rec.endDate && (
                          <span>
                            {t("subscriptions.records.endDate")}:{" "}
                            {formatDate(rec.endDate)}
                          </span>
                        )}
                      </div>
                      {rec.note && (
                        <p className="text-xs text-muted-foreground">
                          {rec.note}
                        </p>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setEditingRecord(rec);
                            setRecordDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            if (
                              window.confirm(t("subscriptions.records.delete"))
                            ) {
                              import("@/api/subscriptionRecords").then((m) => {
                                m.deleteRecord(subscriptionId!, rec.id).then(
                                  () => handleRecordChanged(),
                                );
                              });
                            }
                          }}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                        {rec.invoices.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              setInvoiceDrawerId(rec.invoices[0].invoiceId)
                            }
                          >
                            <ReceiptTextIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <PencilIcon className="size-3.5" />
            {t("subscriptions.edit")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <TrashIcon className="size-3.5" />
            {t("subscriptions.delete")}
          </Button>
        </SheetFooter>
      </SheetContent>

      {detail && (
        <>
          <SubscriptionDialog
            open={editOpen}
            subscription={detail}
            onClose={() => setEditOpen(false)}
          />
          <DeleteSubscriptionDialog
            open={deleteOpen}
            subscription={detail}
            onClose={() => {
              setDeleteOpen(false);
              onClose();
            }}
          />
          <SubscriptionRecordDialog
            open={recordDialogOpen}
            subId={detail.id}
            subscriptionType={detail.subscriptionType}
            record={editingRecord}
            onClose={() => {
              setRecordDialogOpen(false);
              setEditingRecord(null);
              handleRecordChanged();
            }}
            onInvoiceView={(id) => setInvoiceDrawerId(id)}
          />
          <InvoiceDetailDrawer
            invoiceId={invoiceDrawerId}
            open={!!invoiceDrawerId}
            onClose={() => setInvoiceDrawerId(null)}
            onEdit={() => {}}
            onDelete={() => {}}
            onRefresh={handleRecordChanged}
          />
        </>
      )}
    </Sheet>
  );
};

export default SubscriptionDetailDrawer;
