import { useState, useEffect, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Good } from "@/api/goods";
import { type MedicationReminder, updateMedication } from "@/api/medications";
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
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";

const DOSAGE_METHODS = ["口服", "外用", "含服", "注射", "其他"];
const DOSAGE_UNITS = ["片", "粒", "ml", "包", "瓶", "滴"];

interface EditMedicationDialogProps {
  readonly open: boolean;
  readonly reminder: MedicationReminder | null;
  readonly goods: Good[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

const EditMedicationDialog = ({
  open,
  reminder,
  goods,
  onClose,
  onSuccess,
}: EditMedicationDialogProps) => {
  const { t } = useTranslation();
  const [goodId, setGoodId] = useState<number | null>(null);
  const [dosageMethod, setDosageMethod] = useState("");
  const [dosageQuantity, setDosageQuantity] = useState("");
  const [dosageUnit, setDosageUnit] = useState("");
  const [dosageNote, setDosageNote] = useState("");
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [courseStartDate, setCourseStartDate] = useState("");
  const [courseEndDate, setCourseEndDate] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (reminder) {
      setGoodId(reminder.goodId);
      setDosageMethod(reminder.dosageMethod ?? "");
      setDosageQuantity(reminder.dosageQuantity ?? "");
      setDosageUnit(reminder.dosageUnit ?? "");
      setDosageNote(reminder.dosageNote ?? "");
      setSelectedHours(
        reminder.frequencyHours
          .split(",")
          .map(Number)
          .filter((h) => !Number.isNaN(h)),
      );
      setCourseStartDate(reminder.courseStartDate);
      setCourseEndDate(reminder.courseEndDate);
      setEnabled(reminder.enabled);
      setError("");
    }
  }, [reminder]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const toggleHour = (hour: number) => {
    setSelectedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour],
    );
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !reminder || !goodId || selectedHours.length === 0)
      return;
    setError("");
    setSubmitting(true);

    try {
      await updateMedication(reminder.id, {
        goodId: goodId !== reminder.goodId ? goodId : undefined,
        dosageMethod: dosageMethod || undefined,
        dosageQuantity: dosageQuantity || undefined,
        dosageUnit: dosageUnit || undefined,
        dosageNote: dosageNote || undefined,
        frequencyHours:
          selectedHours.sort((a, b) => a - b).join(",") !==
          reminder.frequencyHours
            ? selectedHours.sort((a, b) => a - b).join(",")
            : undefined,
        courseStartDate:
          courseStartDate !== reminder.courseStartDate
            ? courseStartDate
            : undefined,
        courseEndDate:
          courseEndDate !== reminder.courseEndDate ? courseEndDate : undefined,
        enabled: enabled !== reminder.enabled ? enabled : undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("medications.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const goodOptions = goods.map((g) => ({
    value: g.id,
    label: `${g.brandName}-${g.productName}`,
    tag: g.categoryName,
  }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("medications.edit")}</DialogTitle>
          <DialogDescription>
            {t("medications.editDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t("medications.form.good")}</Label>
            <SearchableSelect
              value={goodId}
              onChange={(v) => setGoodId(v)}
              options={goodOptions}
              placeholder={t("medications.form.goodPlaceholder")}
              emptyMessage={t("common.noResults")}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("medications.form.dosageMethod")}</Label>
            <div className="flex flex-wrap gap-1">
              {DOSAGE_METHODS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={dosageMethod === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDosageMethod(dosageMethod === m ? "" : m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-med-qty">
              {t("medications.form.dosageQuantity")}
            </Label>
            <Input
              id="edit-med-qty"
              value={dosageQuantity}
              onChange={(e) => setDosageQuantity(e.target.value)}
              placeholder={t("medications.form.dosageQuantityPlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("medications.form.dosageUnit")}</Label>
            <div className="flex flex-wrap gap-1">
              {DOSAGE_UNITS.map((u) => (
                <Button
                  key={u}
                  type="button"
                  variant={dosageUnit === u ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDosageUnit(dosageUnit === u ? "" : u)}
                >
                  {u}
                </Button>
              ))}
            </div>
            <Input
              id="edit-med-unit"
              value={dosageUnit}
              onChange={(e) => setDosageUnit(e.target.value)}
              placeholder={t("medications.form.dosageUnitPlaceholder")}
              className="h-8 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-med-note">
              {t("medications.form.dosageNote")}
            </Label>
            <Input
              id="edit-med-note"
              value={dosageNote}
              onChange={(e) => setDosageNote(e.target.value)}
              placeholder={t("medications.form.dosageNotePlaceholder")}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("medications.form.frequencyHours")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {HOURS.map((h) => (
                <label
                  key={h}
                  className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary"
                >
                  <Checkbox
                    checked={selectedHours.includes(h)}
                    onCheckedChange={() => toggleHour(h)}
                    className="sr-only"
                  />
                  {h}:00
                </label>
              ))}
            </div>
            {selectedHours.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("medications.form.frequencyHint")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-med-start">
                {t("medications.form.courseStartDate")}
              </Label>
              <Input
                id="edit-med-start"
                type="date"
                value={courseStartDate}
                onChange={(e) => setCourseStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-med-end">
                {t("medications.form.courseEndDate")}
              </Label>
              <Input
                id="edit-med-end"
                type="date"
                value={courseEndDate}
                onChange={(e) => setCourseEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-med-enabled"
              checked={enabled}
              onCheckedChange={(v) => setEnabled(!!v)}
            />
            <Label htmlFor="edit-med-enabled">
              {t("medications.form.enabled")}
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !goodId || selectedHours.length === 0}
            >
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMedicationDialog;
