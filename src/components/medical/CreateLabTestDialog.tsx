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
import { createLabTest, updateLabTest, type VisitLabTest } from "@/api/medical";

interface Props {
  open: boolean;
  visitId: number;
  initialData?: VisitLabTest | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLabTestDialog = ({
  open,
  visitId,
  initialData,
  onClose,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [name, setName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setTestDate(initialData.testDate ?? "");
        setDescription(initialData.description ?? "");
      } else {
        setName("");
        setTestDate("");
        setDescription("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateLabTest(initialData!.id, {
          name: name.trim(),
          testDate: testDate || undefined,
          description: description || undefined,
        });
      } else {
        await createLabTest(visitId, {
          name: name.trim(),
          testDate: testDate || undefined,
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
            {isEdit ? t("medical.editLabTest") : t("medical.addLabTest")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              {t("medical.form.testName")} *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              {t("medical.form.testDate")}
            </label>
            <Input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
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

export default CreateLabTestDialog;
