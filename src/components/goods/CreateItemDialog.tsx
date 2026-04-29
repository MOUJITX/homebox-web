import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { createGoodItem } from "@/api/goodItems";
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

interface CreateItemDialogProps {
  readonly open: boolean;
  readonly goodId: number;
  readonly goodName: string;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const CreateItemDialog = ({
  open,
  goodId,
  goodName,
  onClose,
  onSuccess,
}: CreateItemDialogProps) => {
  const { t } = useTranslation();
  const [productDate, setProductDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [lifeDays, setLifeDays] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setProductDate("");
    setExpirationDate("");
    setLifeDays("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filledCount = [productDate, expirationDate, lifeDays].filter(
    Boolean,
  ).length;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (filledCount !== 2) {
      setError(t("goods.items.errors.exactlyTwo"));
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await createGoodItem(goodId, {
        productDate: productDate || undefined,
        expirationDate: expirationDate || undefined,
        lifeDays: lifeDays ? Number.parseInt(lifeDays, 10) : undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.items.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("goods.items.create")}</DialogTitle>
          <DialogDescription>
            {t("goods.items.createDescription", { name: goodName })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <p className="text-xs text-muted-foreground">
            {t("goods.items.dateHint")}
          </p>
          <div className="grid gap-2">
            <Label htmlFor="create-item-productDate">
              {t("goods.items.form.productDate")}
            </Label>
            <Input
              id="create-item-productDate"
              type="date"
              value={productDate}
              onChange={(e) => setProductDate(e.target.value)}
              disabled={
                filledCount >= 2 && !productDate
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-item-expirationDate">
              {t("goods.items.form.expirationDate")}
            </Label>
            <Input
              id="create-item-expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              disabled={
                filledCount >= 2 && !expirationDate
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-item-lifeDays">
              {t("goods.items.form.lifeDays")}
            </Label>
            <Input
              id="create-item-lifeDays"
              type="number"
              min="1"
              value={lifeDays}
              onChange={(e) => setLifeDays(e.target.value)}
              placeholder={t("goods.items.form.lifeDaysPlaceholder")}
              disabled={
                filledCount >= 2 && !lifeDays
              }
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateItemDialog;
