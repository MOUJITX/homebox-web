import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type MedicationReminder, deleteMedication } from "@/api/medications";
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

interface DeleteMedicationDialogProps {
  readonly open: boolean;
  readonly reminder: MedicationReminder | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DeleteMedicationDialog = ({
  open,
  reminder,
  onClose,
  onSuccess,
}: DeleteMedicationDialogProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !reminder) return;
    setError("");
    setDeleting(true);

    try {
      await deleteMedication(reminder.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("medications.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("medications.delete")}</DialogTitle>
          <DialogDescription>
            {t("medications.deleteConfirm", {
              name: reminder
                ? `${reminder.brandName}-${reminder.productName}`
                : "",
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

export default DeleteMedicationDialog;
