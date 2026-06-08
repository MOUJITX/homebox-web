import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createExamination,
  updateExamination,
  type VisitExamination,
} from "@/api/medical";

interface Props {
  open: boolean;
  visitId: number;
  initialData?: VisitExamination | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateExaminationDialog = ({
  open,
  visitId,
  initialData,
  onClose,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setExamDate(initialData.examDate ?? "");
        setDescription(initialData.description ?? "");
      } else {
        setName("");
        setExamDate("");
        setDescription("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateExamination(initialData!.id, {
          name: name.trim(),
          examDate: examDate || undefined,
          description: description || undefined,
        });
      } else {
        await createExamination(visitId, {
          name: name.trim(),
          examDate: examDate || undefined,
          description: description || undefined,
        });
      }
      onClose();
      onSuccess();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("medical.editExamination")
              : t("medical.addExamination")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              {t("medical.form.examName")} *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              {t("medical.form.examDate")}
            </label>
            <Input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              {t("medical.form.description")}
            </label>
            <textarea
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none min-h-16"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {isEdit ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExaminationDialog;
