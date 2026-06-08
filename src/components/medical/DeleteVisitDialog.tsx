import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteVisitRecord, type VisitRecord } from "@/api/medical";

interface Props {
  open: boolean;
  record: VisitRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteVisitDialog = ({ open, record, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await deleteVisitRecord(record.id);
      onClose();
      onSuccess();
    } catch {
      // handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  const hasSubRecords = record
    ? record.examinationCount > 0 ||
      record.labTestCount > 0 ||
      record.prescriptionCount > 0
    : false;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("medical.delete")}</DialogTitle>
          <DialogDescription>
            {hasSubRecords
              ? t("medical.deleteBlocked")
              : t("medical.deleteConfirm", { name: record?.patientName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          {!hasSubRecords && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {t("common.delete")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVisitDialog;
