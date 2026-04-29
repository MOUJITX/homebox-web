import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import type { GoodItem } from "@/api/goods";
import { updateGoodItem } from "@/api/goodItems";
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

interface EditItemDialogProps {
  readonly open: boolean;
  readonly goodId: number;
  readonly item: GoodItem | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const EditItemDialog = ({
  open,
  goodId,
  item,
  onClose,
  onSuccess,
}: EditItemDialogProps) => {
  const { t } = useTranslation();
  const [productDate, setProductDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [lifeDays, setLifeDays] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [prevItemId, setPrevItemId] = useState(item?.id);
  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    if (item) {
      setProductDate(item.productDate);
      setExpirationDate(item.expirationDate);
      setLifeDays(String(item.lifeDays));
    }
    setError("");
  }

  const handleClose = () => {
    setError("");
    onClose();
  };

  const filledCount = [productDate, expirationDate, lifeDays].filter(
    Boolean,
  ).length;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !item) return;

    if (filledCount < 2) {
      setError(t("goods.items.errors.exactlyTwo"));
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await updateGoodItem(goodId, item.id, {
        productDate: productDate || undefined,
        expirationDate: expirationDate || undefined,
        lifeDays: lifeDays ? Number.parseInt(lifeDays, 10) : undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.items.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("goods.items.edit")}</DialogTitle>
          <DialogDescription>
            {t("goods.items.editDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <p className="text-xs text-muted-foreground">
            {t("goods.items.dateHint")}
          </p>
          <div className="grid gap-2">
            <Label htmlFor="edit-item-productDate">
              {t("goods.items.form.productDate")}
            </Label>
            <Input
              id="edit-item-productDate"
              type="date"
              value={productDate}
              onChange={(e) => setProductDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-item-expirationDate">
              {t("goods.items.form.expirationDate")}
            </Label>
            <Input
              id="edit-item-expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-item-lifeDays">
              {t("goods.items.form.lifeDays")}
            </Label>
            <Input
              id="edit-item-lifeDays"
              type="number"
              min="1"
              value={lifeDays}
              onChange={(e) => setLifeDays(e.target.value)}
              placeholder={t("goods.items.form.lifeDaysPlaceholder")}
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
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
