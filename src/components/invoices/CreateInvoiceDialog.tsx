import { useState, useRef, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { InvoiceType, InvoiceStatus, InvoiceParseResult } from "@/api/invoices";
import type { InvoiceDetail } from "@/api/invoices";
import { createInvoice, parseInvoice } from "@/api/invoices";
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

interface CreateInvoiceDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly onCreated?: (invoice: InvoiceDetail) => void | Promise<void>;
}

const CreateInvoiceDialog = ({
  open,
  onClose,
  onSuccess,
  onCreated,
}: CreateInvoiceDialogProps) => {
  const { t } = useTranslation();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("DIGITAL_INVOICE");
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>("NORMAL");
  const [sellerName, setSellerName] = useState("");
  const [sellerTaxId, setSellerTaxId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerTaxId, setBuyerTaxId] = useState("");
  const [amount, setAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [fileId, setFileId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);

  const resetForm = () => {
    setInvoiceNumber("");
    setInvoiceDate("");
    setInvoiceType("DIGITAL_INVOICE");
    setInvoiceStatus("NORMAL");
    setSellerName("");
    setSellerTaxId("");
    setBuyerName("");
    setBuyerTaxId("");
    setAmount("");
    setTaxAmount("");
    setTotalAmount("");
    setRemark("");
    setFileId(null);
    setPreviewImage(null);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const applyParseResult = (result: InvoiceParseResult) => {
    if (result.invoiceNumber) setInvoiceNumber(result.invoiceNumber);
    if (result.invoiceDate) setInvoiceDate(result.invoiceDate);
    if (result.invoiceType) setInvoiceType(result.invoiceType as InvoiceType);
    if (result.invoiceStatus) setInvoiceStatus(result.invoiceStatus as InvoiceStatus);
    if (result.sellerName) setSellerName(result.sellerName);
    if (result.sellerTaxId) setSellerTaxId(result.sellerTaxId);
    if (result.buyerName) setBuyerName(result.buyerName);
    if (result.buyerTaxId) setBuyerTaxId(result.buyerTaxId);
    if (result.amount != null) setAmount(String(result.amount));
    if (result.taxAmount != null) setTaxAmount(String(result.taxAmount));
    if (result.totalAmount != null) setTotalAmount(String(result.totalAmount));
    if (result.remark) setRemark(result.remark);
    if (result.fileId) setFileId(result.fileId);
    if (result.previewImage) setPreviewImage(result.previewImage);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    resetForm();
    try {
      const { data } = await parseInvoice(file);
      applyParseResult(data);
    } catch (err) {
      setError(getErrorMessage(err) ?? t("invoices.errors.parseFailed"));
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !totalAmount) return;
    setError("");
    setSubmitting(true);

    try {
      const { data: created } = await createInvoice({
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
        fileId: fileId ?? undefined,
        previewImage: previewImage ?? undefined,
      });
      handleClose();
      if (onCreated) {
        await onCreated(created);
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("invoices.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("invoices.create")}</DialogTitle>
          <DialogDescription>{t("invoices.createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t("invoices.form.uploadFile")}</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xml,.ofd"
                onChange={handleFileUpload}
                disabled={parsing}
                className="flex-1"
              />
              {parsing && (
                <span className="text-sm text-muted-foreground">
                  {t("invoices.form.parsing")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("invoices.form.uploadHint")}
            </p>
          </div>

          {previewImage && (
            <div className="grid gap-2">
              <Label>{t("invoices.detail.preview")}</Label>
              <img
                src={`data:image/png;base64,${previewImage}`}
                alt={t("invoices.detail.preview")}
                className="w-full rounded border"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("invoices.form.invoiceType")}</Label>
              <Select value={invoiceType} onValueChange={(v) => v && setInvoiceType(v)}>
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
              <Select value={invoiceStatus} onValueChange={(v) => v && setInvoiceStatus(v)}>
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
              <Label htmlFor="invoice-number">{t("invoices.form.invoiceNumber")}</Label>
              <Input id="invoice-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-date">{t("invoices.form.invoiceDate")}</Label>
              <Input id="invoice-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="buyer-name">{t("invoices.form.buyerName")}</Label>
              <Input id="buyer-name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer-tax-id">{t("invoices.form.buyerTaxId")}</Label>
              <Input id="buyer-tax-id" value={buyerTaxId} onChange={(e) => setBuyerTaxId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="seller-name">{t("invoices.form.sellerName")}</Label>
              <Input id="seller-name" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seller-tax-id">{t("invoices.form.sellerTaxId")}</Label>
              <Input id="seller-tax-id" value={sellerTaxId} onChange={(e) => setSellerTaxId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">{t("invoices.form.amount")}</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tax-amount">{t("invoices.form.taxAmount")}</Label>
              <Input id="tax-amount" type="number" step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-amount">{t("invoices.form.totalAmount")} *</Label>
              <Input id="total-amount" type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remark">{t("invoices.form.remark")}</Label>
            <textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceDialog;
