import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectPopup, SelectItem, SelectValue } from "@/components/ui/select";
import { getInvoices, type Invoice } from "@/api/invoices";
import { type VisitSourceType } from "@/api/medical";

interface Props {
  open: boolean;
  visitId: number;
  sourceType: VisitSourceType;
  sourceId: number;
  onClose: () => void;
  onBind: (invoiceId: number) => Promise<void>;
}

const BindVisitInvoiceDialog = ({ open, visitId, sourceType, sourceId, onClose, onBind }: Props) => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      getInvoices({ size: 200 }).then(({ data }) => setInvoices(data.content)).catch(() => {});
      setSelectedId(null);
    }
  }, [open]);

  const handleBind = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try { await onBind(selectedId); onClose(); }
    catch {} finally { setSubmitting(false); }
  };

  const selectedInvoice = invoices.find((i) => i.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("medical.bindInvoice")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Select value={selectedId} onValueChange={(v) => setSelectedId(v as number)}>
            <SelectTrigger>
              <SelectValue placeholder={t("medical.form.selectInvoice")}>
                {() => selectedInvoice ? `${selectedInvoice.invoiceNumber ?? `#${selectedInvoice.id}`} - ${selectedInvoice.totalAmount}` : ""}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {invoices.map((inv) => (
                <SelectItem key={inv.id} value={inv.id}>
                  {inv.invoiceNumber ?? `#${inv.id}`} - {inv.totalAmount} ({inv.invoiceType})
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={handleBind} disabled={submitting || !selectedId}>{t("medical.bind")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BindVisitInvoiceDialog;
