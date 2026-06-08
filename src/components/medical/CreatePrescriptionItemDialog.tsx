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
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { getMedications, type MedicationReminder } from "@/api/medications";

import type { CreatePrescriptionItemRequest } from "@/api/medical";
import CreateMedicationDialog from "@/components/medications/CreateMedicationDialog";

interface Props {
  open: boolean;
  initialData?: { medicationReminderId: number; note?: string } | null;
  onClose: () => void;
  onSubmit: (data: CreatePrescriptionItemRequest) => Promise<void>;
}

const CreatePrescriptionItemDialog = ({
  open,
  initialData,
  onClose,
  onSubmit,
}: Props) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);

  const [reminderId, setReminderId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createMedOpen, setCreateMedOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const load = async () => {
        try {
          const { data: meds } = await getMedications(0, 200);
          setReminders(meds.content);
        } catch {}
      };
      void load();
      if (initialData) {
        setReminderId(initialData.medicationReminderId);
        setNote(initialData.note ?? "");
      } else {
        setReminderId(null);
        setNote("");
      }
    }
  }, [open, initialData]);

  const selectedReminder = reminders.find((r) => r.id === reminderId);

  const handleSubmit = async () => {
    if (!reminderId) return;
    setSubmitting(true);
    try {
      await onSubmit({
        medicationReminderId: reminderId,
        note: note || undefined,
      });
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
                ? t("medical.editPrescriptionItem")
                : t("medical.addPrescriptionItem")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {t("medical.form.medicationReminder")} *
                </label>
                <Select
                  value={reminderId}
                  onValueChange={(v) => setReminderId(v as number)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("medical.form.selectReminder")}>
                      {() =>
                        selectedReminder
                          ? `${selectedReminder.brandName}-${selectedReminder.productName}`
                          : ""
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {reminders.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.brandName}-{r.productName}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateMedOpen(true)}
              >
                {t("medical.createReminder")}
              </Button>
            </div>

            {selectedReminder && (
              <div className="text-xs text-muted-foreground">
                {[
                  selectedReminder.dosageMethod,
                  selectedReminder.dosageQuantity,
                  selectedReminder.dosageUnit,
                ]
                  .filter(Boolean)
                  .join(" ")}
                {selectedReminder.dosageNote &&
                  ` (${selectedReminder.dosageNote})`}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t("medical.form.note")}
              </label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !reminderId}>
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateMedicationDialog
        open={createMedOpen}
        onClose={() => setCreateMedOpen(false)}
        onSuccess={() => {
          const reload = async () => {
            try {
              const { data: meds } = await getMedications(0, 200);
              setReminders(meds.content);
            } catch {}
          };
          void reload();
        }}
      />
    </>
  );
};

export default CreatePrescriptionItemDialog;
