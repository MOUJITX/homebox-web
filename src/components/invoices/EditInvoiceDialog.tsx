import { useState, useEffect, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { InvoiceDetail, InvoiceType, InvoiceStatus } from "@/api/invoices";
import { updateInvoice } from "@/api/invoices";
import { getErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { INVOICE_TYPES, INVOICE_STATUSES } from "./constants";

interface EditInvoiceDialogProps {
  readonly open: boolean;
  readonly invoice: InvoiceDetail | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const EditInvoiceDialog = ({
  open,
  invoice,
  onClose,
  onSuccess,
}: EditInvoiceDialogProps) => {
  const { t } = useTranslation();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceType, setInvoiceType] =
    useState<InvoiceType>("DIGITAL_INVOICE");
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>("NORMAL");
  const [sellerName, setSellerName] = useState("");
  const [sellerTaxId, setSellerTaxId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerTaxId, setBuyerTaxId] = useState("");
  const [amount, setAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [remark, setRemark] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoice && open) {
      setInvoiceNumber(invoice.invoiceNumber ?? "");
      setInvoiceDate(invoice.invoiceDate ?? "");
      setInvoiceType(invoice.invoiceType);
      setInvoiceStatus(invoice.invoiceStatus);
      setSellerName(invoice.sellerName ?? "");
      setBuyerName(invoice.buyerName ?? "");
      setAmount(invoice.amount != null ? String(invoice.amount) : "");
      setTaxAmount(invoice.taxAmount != null ? String(invoice.taxAmount) : "");
      setTotalAmount(
        invoice.totalAmount != null ? String(invoice.totalAmount) : "",
      );
      setSellerTaxId(invoice.sellerTaxId ?? "");
      setBuyerTaxId(invoice.buyerTaxId ?? "");
      setRemark(invoice.remark ?? "");
    }
  }, [invoice, open]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !invoice || !totalAmount) return;
    setError("");
    setSubmitting(true);

    try {
      await updateInvoice(invoice.id, {
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate || undefined,
        invoiceType,
        invoiceStatus,
        sellerName: sellerName || undefined,
        sellerTaxId: sellerTaxId || undefined,
        buyerName: buyerName || undefined,
        buyerTaxId: buyerTaxId || undefined,
        amount: amount ? Number.parseFloat(amount) : undefined,
        taxAmount: taxAmount ? Number.parseFloat(taxAmount) : undefined,
        totalAmount: Number.parseFloat(totalAmount),
        remark: remark || undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("invoices.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("invoices.edit")}</DialogTitle>
          <DialogDescription>
            {t("invoices.editDescription", {
              number: invoice.invoiceNumber ?? invoice.id,
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {invoice.previewImage && (
            <div className="grid gap-2">
              <Label>{t("invoices.detail.preview")}</Label>
              <img
                src={`data:image/png;base64,${invoice.previewImage}`}
                alt={t("invoices.detail.preview")}
                className="w-full rounded border"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("invoices.form.invoiceType")}</Label>
              <Select
                value={invoiceType}
                onValueChange={(v) => v && setInvoiceType(v)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {() => t(`invoices.type.${invoiceType}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {INVOICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`invoices.type.${type}`)}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("invoices.form.invoiceStatus")}</Label>
              <Select
                value={invoiceStatus}
                onValueChange={(v) => v && setInvoiceStatus(v)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {() => t(`invoices.status.${invoiceStatus}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {INVOICE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`invoices.status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-invoice-number">
                {t("invoices.form.invoiceNumber")}
              </Label>
              <Input
                id="edit-invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-invoice-date">
                {t("invoices.form.invoiceDate")}
              </Label>
              <Input
                id="edit-invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-buyer-name">
                {t("invoices.form.buyerName")}
              </Label>
              <Input
                id="edit-buyer-name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-buyer-tax-id">
                {t("invoices.form.buyerTaxId")}
              </Label>
              <Input
                id="edit-buyer-tax-id"
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-seller-name">
                {t("invoices.form.sellerName")}
              </Label>
              <Input
                id="edit-seller-name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-seller-tax-id">
                {t("invoices.form.sellerTaxId")}
              </Label>
              <Input
                id="edit-seller-tax-id"
                value={sellerTaxId}
                onChange={(e) => setSellerTaxId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">{t("invoices.form.amount")}</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tax-amount">
                {t("invoices.form.taxAmount")}
              </Label>
              <Input
                id="edit-tax-amount"
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-total-amount">
                {t("invoices.form.totalAmount")} *
              </Label>
              <Input
                id="edit-total-amount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-remark">{t("invoices.form.remark")}</Label>
            <textarea
              id="edit-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceDialog;
