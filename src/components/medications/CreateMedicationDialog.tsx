import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Good } from "@/api/goods";
import { createMedication } from "@/api/medications";
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

interface CreateMedicationDialogProps {
  readonly open: boolean;
  readonly goods: Good[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

const CreateMedicationDialog = ({
  open,
  goods,
  onClose,
  onSuccess,
}: CreateMedicationDialogProps) => {
  const { t } = useTranslation();
  const [goodId, setGoodId] = useState<number | null>(null);
  const [dosageMethod, setDosageMethod] = useState("");
  const [dosageQuantity, setDosageQuantity] = useState("");
  const [dosageUnit, setDosageUnit] = useState("");
  const [dosageNote, setDosageNote] = useState("");
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [courseStartDate, setCourseStartDate] = useState("");
  const [courseEndDate, setCourseEndDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setGoodId(null);
    setDosageMethod("");
    setDosageQuantity("");
    setDosageUnit("");
    setDosageNote("");
    setSelectedHours([]);
    setCourseStartDate("");
    setCourseEndDate("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleHour = (hour: number) => {
    setSelectedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour],
    );
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !goodId || selectedHours.length === 0) return;
    setError("");
    setSubmitting(true);

    try {
      await createMedication({
        goodId,
        dosageMethod: dosageMethod || undefined,
        dosageQuantity: dosageQuantity || undefined,
        dosageUnit: dosageUnit || undefined,
        dosageNote: dosageNote || undefined,
        frequencyHours: selectedHours.sort((a, b) => a - b).join(","),
        courseStartDate,
        courseEndDate,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("medications.errors.createFailed"));
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
          <DialogTitle>{t("medications.create")}</DialogTitle>
          <DialogDescription>
            {t("medications.createDescription")}
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
            <Label htmlFor="med-qty">
              {t("medications.form.dosageQuantity")}
            </Label>
            <Input
              id="med-qty"
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
              id="med-unit"
              value={dosageUnit}
              onChange={(e) => setDosageUnit(e.target.value)}
              placeholder={t("medications.form.dosageUnitPlaceholder")}
              className="h-8 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="med-note">{t("medications.form.dosageNote")}</Label>
            <Input
              id="med-note"
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
              <Label htmlFor="med-start">
                {t("medications.form.courseStartDate")}
              </Label>
              <Input
                id="med-start"
                type="date"
                value={courseStartDate}
                onChange={(e) => setCourseStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="med-end">
                {t("medications.form.courseEndDate")}
              </Label>
              <Input
                id="med-end"
                type="date"
                value={courseEndDate}
                onChange={(e) => setCourseEndDate(e.target.value)}
                required
              />
            </div>
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
              {submitting ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMedicationDialog;
