import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import type { GoodCategory } from "@/api/goodCategories";
import type { GoodBrand } from "@/api/goodBrands";
import type { Good } from "@/api/goods";
import { updateGood } from "@/api/goods";
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
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import CategoryManagerDialog from "./CategoryManagerDialog";
import BrandManagerDialog from "./BrandManagerDialog";

interface EditGoodDialogProps {
  readonly open: boolean;
  readonly good: Good | null;
  readonly categories: GoodCategory[];
  readonly brands: GoodBrand[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly onRefDataChanged: () => void;
}

const EditGoodDialog = ({
  open,
  good,
  categories,
  brands,
  onClose,
  onSuccess,
  onRefDataChanged,
}: EditGoodDialogProps) => {
  const { t } = useTranslation();
  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [expiringSoonDays, setExpiringSoonDays] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [brandManagerOpen, setBrandManagerOpen] = useState(false);

  const [prevGoodId, setPrevGoodId] = useState(good?.id);
  if (good?.id !== prevGoodId) {
    setPrevGoodId(good?.id);
    if (good) {
      setProductName(good.productName);
      setBarcode(good.barcode);
      setCategoryId(good.categoryId);
      setBrandId(good.brandId);
      setExpiringSoonDays(String(good.expiringSoonDays));
    }
    setError("");
  }

  const handleClose = () => {
    setError("");
    setCategoryManagerOpen(false);
    setBrandManagerOpen(false);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !good || !categoryId || !brandId) return;
    setError("");
    setSubmitting(true);

    try {
      await updateGood(good.id, {
        productName,
        barcode,
        categoryId,
        brandId,
        expiringSoonDays: expiringSoonDays
          ? Number.parseInt(expiringSoonDays, 10)
          : undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!good) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("goods.edit")}</DialogTitle>
            <DialogDescription>
              {t("goods.editDescription", { name: good.productName })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-good-name">
                {t("goods.form.productName")}
              </Label>
              <Input
                id="edit-good-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("goods.form.productNamePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-good-barcode">
                {t("goods.form.barcode")}
              </Label>
              <Input
                id="edit-good-barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={t("goods.form.barcodePlaceholder")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("goods.form.category")}</Label>
              <div className="flex gap-2">
                <Select
                  value={categoryId}
                  onValueChange={(v) => v !== undefined && setCategoryId(v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("goods.form.categoryPlaceholder")}
                    >
                      {() =>
                        categories.find((c) => c.id === categoryId)?.name ??
                        t("goods.form.categoryPlaceholder")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCategoryManagerOpen(true)}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("goods.form.brand")}</Label>
              <div className="flex gap-2">
                <SearchableSelect
                  value={brandId}
                  onChange={(v) => v != null && setBrandId(v)}
                  options={brands.map((b) => ({
                    value: b.id,
                    label: b.brandName,
                  }))}
                  placeholder={t("goods.form.brandPlaceholder")}
                  emptyMessage={t("common.noResults")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setBrandManagerOpen(true)}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-good-expiring">
                {t("goods.form.expiringSoonDays")}
              </Label>
              <Input
                id="edit-good-expiring"
                type="number"
                min="1"
                value={expiringSoonDays}
                onChange={(e) => setExpiringSoonDays(e.target.value)}
                placeholder={t("goods.form.expiringSoonDaysPlaceholder")}
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
      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        onChanged={onRefDataChanged}
      />
      <BrandManagerDialog
        open={brandManagerOpen}
        onClose={() => setBrandManagerOpen(false)}
        onChanged={onRefDataChanged}
      />
    </>
  );
};

export default EditGoodDialog;
