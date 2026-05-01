import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Invoice } from "@/api/invoices";
import { deleteInvoice } from "@/api/invoices";
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

interface DeleteInvoiceDialogProps {
  readonly open: boolean;
  readonly invoice: Invoice | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DeleteInvoiceDialog = ({
  open,
  invoice,
  onClose,
  onSuccess,
}: DeleteInvoiceDialogProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !invoice) return;
    setError("");
    setDeleting(true);

    try {
      await deleteInvoice(invoice.id);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("invoices.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("invoices.delete")}</DialogTitle>
          <DialogDescription>
            {t("invoices.deleteConfirm", {
              number: invoice.invoiceNumber ?? invoice.id,
            })}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteInvoiceDialog;
