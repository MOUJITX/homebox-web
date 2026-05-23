import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPrescription,
  updatePrescription,
  type VisitPrescription,
} from "@/api/medical";

interface Props {
  open: boolean;
  visitId: number;
  initialData?: VisitPrescription | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePrescriptionDialog = ({ open, visitId, initialData, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(initialData?.description ?? "");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await updatePrescription(initialData!.id, { description: description || undefined });
      } else {
        await createPrescription(visitId, { description: description || undefined });
      }
      onClose(); onSuccess();
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("medical.editPrescription") : t("medical.addPrescription")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">{t("medical.form.description")}</label>
            <textarea className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none min-h-16" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{isEdit ? t("common.save") : t("common.create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePrescriptionDialog;
