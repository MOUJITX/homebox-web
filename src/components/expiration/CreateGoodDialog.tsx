import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import type { GoodCategory } from "@/api/goodCategories";
import type { GoodBrand } from "@/api/goodBrands";
import { createGood, getGoodByBarcode } from "@/api/goods";
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
import BarcodeExistsDialog from "./BarcodeExistsDialog";
import CategoryManagerDialog from "./CategoryManagerDialog";
import BrandManagerDialog from "./BrandManagerDialog";

interface CreateGoodDialogProps {
  readonly open: boolean;
  readonly categories: GoodCategory[];
  readonly brands: GoodBrand[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly onNavigateToGood: (goodId: number) => void;
  readonly onRefDataChanged: () => void;
}

const CreateGoodDialog = ({
  open,
  categories,
  brands,
  onClose,
  onSuccess,
  onNavigateToGood,
  onRefDataChanged,
}: CreateGoodDialogProps) => {
  const { t } = useTranslation();
  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [expiringSoonDays, setExpiringSoonDays] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [barcodeConflictGoodId, setBarcodeConflictGoodId] = useState<
    number | null
  >(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [brandManagerOpen, setBrandManagerOpen] = useState(false);

  const resetForm = () => {
    setProductName("");
    setBarcode("");
    setCategoryId(null);
    setBrandId(null);
    setExpiringSoonDays("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    setCategoryManagerOpen(false);
    setBrandManagerOpen(false);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !categoryId || !brandId) return;
    setError("");
    setSubmitting(true);

    try {
      const existingGood = await getGoodByBarcode(barcode).catch(() => null);
      if (existingGood?.data) {
        setBarcodeConflictGoodId(existingGood.data.id);
        setSubmitting(false);
        return;
      }

      await createGood({
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
      setError(getErrorMessage(err) ?? t("goods.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeConflictAddItem = () => {
    const goodId = barcodeConflictGoodId;
    setBarcodeConflictGoodId(null);
    handleClose();
    if (goodId) onNavigateToGood(goodId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("goods.create")}</DialogTitle>
            <DialogDescription>
              {t("goods.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-good-name">
                {t("goods.form.productName")}
              </Label>
              <Input
                id="create-good-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("goods.form.productNamePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-good-barcode">
                {t("goods.form.barcode")}
              </Label>
              <Input
                id="create-good-barcode"
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
              <Label htmlFor="create-good-expiring">
                {t("goods.form.expiringSoonDays")}
              </Label>
              <Input
                id="create-good-expiring"
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
                {submitting ? t("common.creating") : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <BarcodeExistsDialog
        open={!!barcodeConflictGoodId}
        barcode={barcode}
        onClose={() => setBarcodeConflictGoodId(null)}
        onAddItem={handleBarcodeConflictAddItem}
      />
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

export default CreateGoodDialog;
