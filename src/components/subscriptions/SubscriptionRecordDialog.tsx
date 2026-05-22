import { useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon } from "lucide-react";
import type { SubscriptionRecord, SubscriptionType } from "@/api/subscriptions";
import { addRecord, updateRecord } from "@/api/subscriptionRecords";
import { usePaymentMethods } from "@/hooks/queries/usePaymentMethods";
import { getErrorMessage } from "@/lib/error";
import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "@/hooks/queries/subscriptionKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import SubscriptionAttachmentManager from "./SubscriptionAttachmentManager";
import SubscriptionInvoiceManager from "./SubscriptionInvoiceManager";
import PaymentMethodManagerDialog from "./PaymentMethodManagerDialog";

interface SubscriptionRecordDialogProps {
  readonly open: boolean;
  readonly subId: number;
  readonly subscriptionType: SubscriptionType;
  readonly record?: SubscriptionRecord | null;
  readonly onClose: () => void;
  readonly onInvoiceView: (invoiceId: number) => void;
}

const SubscriptionRecordDialog = ({
  open, subId, subscriptionType, record, onClose, onInvoiceView,
}: SubscriptionRecordDialogProps) => {
  const { t } = useTranslation();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const queryClient = useQueryClient();
  const isEdit = !!record;

  const [recordDate, setRecordDate] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pmManagerOpen, setPmManagerOpen] = useState(false);
  const [attachments, setAttachments] = useState(record?.attachments ?? []);
  const [invoices, setInvoices] = useState(record?.invoices ?? []);

  const initForm = () => {
    if (record) {
      setRecordDate(record.recordDate);
      setAmount(String(record.amount));
      setCurrency(record.currency);
      setStartDate(record.startDate);
      setEndDate(record.endDate ?? "");
      setQuantity(record.quantity ?? "");
      setPaymentMethodId(record.paymentMethodId);
      setNote(record.note ?? "");
      setAttachments(record.attachments);
      setInvoices(record.invoices);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setRecordDate(today);
      setAmount("");
      setCurrency("CNY");
      setStartDate(today);
      setEndDate("");
      setQuantity("");
      setPaymentMethodId(null);
      setNote("");
      setAttachments([]);
      setInvoices([]);
    }
    setError("");
  };

  // Re-initialize form when opening or switching between create/edit modes
  useEffect(() => {
    if (open) initForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!amount || !recordDate || !startDate) {
      setError(t("common.error"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const data = {
        recordDate,
        amount: Number(amount),
        currency: currency || undefined,
        startDate,
        endDate: endDate || undefined,
        quantity: quantity || undefined,
        paymentMethodId: paymentMethodId ?? undefined,
        note: note || undefined,
      };

      if (isEdit) {
        await updateRecord(subId, record!.id, data);
      } else {
        await addRecord(subId, data);
      }

      queryClient.invalidateQueries({ queryKey: subscriptionKeys.records(subId) });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subId) });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const refreshRecordData = () => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.records(subId) });
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subId) });
  };

  const pmOptions = paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }} onOpenAutoFocus={initForm}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("subscriptions.records.edit") : t("subscriptions.records.add")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="grid gap-4" id="record-form">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="recordDate">{t("subscriptions.records.date")}</Label>
                <Input id="recordDate" type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">{t("subscriptions.records.amount")}</Label>
                <Input id="amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="currency">{t("subscriptions.form.currency")}</Label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="CNY" />
              </div>
              <div className="grid gap-2">
                <Label>{t("subscriptions.records.paymentMethod")}</Label>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <SearchableSelect
                      value={paymentMethodId}
                      onChange={(v) => setPaymentMethodId(v)}
                      options={pmOptions}
                      placeholder={t("subscriptions.searchPlaceholder")}
                      emptyMessage={t("common.noResults")}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPmManagerOpen(true)}>
                    <PlusIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{t("subscriptions.records.startDate")}</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">{t("subscriptions.records.endDate")}</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {subscriptionType === "PAY_AS_YOU_GO" && (
              <div className="grid gap-2">
                <Label htmlFor="quantity">{t("subscriptions.records.quantity")}</Label>
                <Input id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder='e.g. "500万 token"' />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="recordNote">{t("subscriptions.records.note")}</Label>
              <Input id="recordNote" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>

          {isEdit && record && (
            <div className="mt-4 border-t pt-4">
              <SubscriptionAttachmentManager
                recordId={record.id}
                attachments={attachments}
                onChanged={refreshRecordData}
              />
            </div>
          )}
          {isEdit && record && (
            <div className="mt-4 border-t pt-4">
              <SubscriptionInvoiceManager
                recordId={record.id}
                invoices={invoices}
                onChanged={refreshRecordData}
                onInvoiceView={onInvoiceView}
              />
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="record-form" disabled={submitting}>
            {isEdit ? <PencilIcon className="size-4" /> : <PlusIcon className="size-4" />}
            {isEdit ? t("common.save") : t("subscriptions.records.add")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <PaymentMethodManagerDialog open={pmManagerOpen} onClose={() => setPmManagerOpen(false)} />
    </Dialog>
  );
};

export default SubscriptionRecordDialog;
