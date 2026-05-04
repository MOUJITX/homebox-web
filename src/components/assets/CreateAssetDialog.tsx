import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import { createAsset } from "@/api/assets";
import { getErrorMessage } from "@/lib/error";
import { useWarrantyDateCalc } from "@/hooks/useWarrantyDateCalc";
import { useAssetCategories } from "@/hooks/queries/useAssetCategories";
import { useAssetPlaces } from "@/hooks/queries/useAssetPlaces";
import { useAssetStores } from "@/hooks/queries/useAssetStores";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
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
import AssetCategoryManagerDialog from "./AssetCategoryManagerDialog";
import AssetPlaceManagerDialog from "./AssetPlaceManagerDialog";
import AssetStoreManagerDialog from "./AssetStoreManagerDialog";

interface CreateAssetDialogProps {
  readonly open: boolean;
  readonly parentId?: number | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const CreateAssetDialog = ({
  open,
  parentId = null,
  onClose,
  onSuccess,
}: CreateAssetDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useAssetCategories();
  const { data: places = [] } = useAssetPlaces();
  const { data: stores = [] } = useAssetStores();
  const invalidate = useInvalidateAssets();

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<number | null>(null);
  const [inUse, setInUse] = useState(true);
  const [retireDate, setRetireDate] = useState("");
  const [price, setPrice] = useState("");
  const [shopDate, setShopDate] = useState("");
  const [storeId, setStoreId] = useState<number | null>(null);
  const [hasWarranty, setHasWarranty] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [placeManagerOpen, setPlaceManagerOpen] = useState(false);
  const [storeManagerOpen, setStoreManagerOpen] = useState(false);

  const warranty = useWarrantyDateCalc();

  const resetForm = () => {
    setName("");
    setBarcode("");
    setSerialNumber("");
    setCategoryId(null);
    setPlaceId(null);
    setInUse(true);
    setRetireDate("");
    setPrice("");
    setShopDate("");
    setStoreId(null);
    setHasWarranty(false);
    setNote("");
    setError("");
    warranty.resetDates();
  };

  const handleClose = () => {
    resetForm();
    setCategoryManagerOpen(false);
    setPlaceManagerOpen(false);
    setStoreManagerOpen(false);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !categoryId || !placeId) return;
    setError("");
    setSubmitting(true);

    try {
      await createAsset({
        name,
        barcode: barcode || undefined,
        serialNumber: serialNumber || undefined,
        categoryId,
        placeId,
        inUse,
        retireDate: !inUse ? retireDate || undefined : undefined,
        price: price ? Number.parseFloat(price) : undefined,
        shopDate: shopDate || undefined,
        storeId: storeId ?? undefined,
        hasWarranty,
        activeDate: hasWarranty ? warranty.activeDate || undefined : undefined,
        warrantyPeriod: hasWarranty && warranty.warrantyPeriod ? Number.parseInt(warranty.warrantyPeriod, 10) : undefined,
        expirationDate: hasWarranty ? warranty.expirationDate || undefined : undefined,
        note: note || undefined,
        parentId: parentId ?? undefined,
      });
      handleClose();
      void invalidate.invalidateList();
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {parentId ? t("assets.subAssets.create") : t("assets.create")}
            </DialogTitle>
            <DialogDescription>
              {parentId
                ? t("assets.subAssets.createDescription")
                : t("assets.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="asset-name">{t("assets.form.name")}</Label>
              <Input
                id="asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="asset-barcode">{t("assets.form.barcode")}</Label>
                <Input
                  id="asset-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder={t("assets.form.barcodePlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-serial">{t("assets.form.serialNumber")}</Label>
                <Input
                  id="asset-serial"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder={t("assets.form.serialNumberPlaceholder")}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("assets.form.category")}</Label>
              <div className="flex gap-2">
                <Select
                  value={categoryId}
                  onValueChange={(v) => v !== undefined && setCategoryId(v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("assets.form.categoryPlaceholder")}>
                      {() =>
                        categories.find((c) => c.id === categoryId)?.name ??
                        t("assets.form.categoryPlaceholder")
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
              <Label>{t("assets.form.place")}</Label>
              <div className="flex gap-2">
                <Select
                  value={placeId}
                  onValueChange={(v) => v !== undefined && setPlaceId(v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("assets.form.placePlaceholder")}>
                      {() =>
                        places.find((p) => p.id === placeId)?.name ??
                        t("assets.form.placePlaceholder")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {places.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPlaceManagerOpen(true)}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("assets.form.store")}</Label>
              <div className="flex gap-2">
                <Select
                  value={storeId}
                  onValueChange={(v) => v !== undefined && setStoreId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("assets.form.storePlaceholder")}>
                      {() =>
                        stores.find((s) => s.id === storeId)?.name ??
                        t("assets.form.storePlaceholder")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value={null}>
                      {t("assets.form.storePlaceholder")}
                    </SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.channel ? ` (${s.channel})` : ""}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setStoreManagerOpen(true)}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="asset-price">{t("assets.form.price")}</Label>
                <Input
                  id="asset-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t("assets.form.pricePlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-shop-date">{t("assets.form.shopDate")}</Label>
                <Input
                  id="asset-shop-date"
                  type="date"
                  value={shopDate}
                  onChange={(e) => setShopDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="asset-in-use"
                type="checkbox"
                checked={inUse}
                onChange={(e) => {
                  setInUse(e.target.checked);
                  if (e.target.checked) setRetireDate("");
                }}
                className="size-4 rounded"
              />
              <Label htmlFor="asset-in-use" className="cursor-pointer">
                {t("assets.form.inUse")}
              </Label>
            </div>
            {!inUse && (
              <div className="grid gap-2">
                <Label htmlFor="asset-retire-date">
                  {t("assets.form.retireDate")}
                </Label>
                <Input
                  id="asset-retire-date"
                  type="date"
                  value={retireDate}
                  onChange={(e) => setRetireDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="asset-has-warranty"
                type="checkbox"
                checked={hasWarranty}
                onChange={(e) => {
                  setHasWarranty(e.target.checked);
                  if (!e.target.checked) warranty.resetDates();
                }}
                className="size-4 rounded"
              />
              <Label htmlFor="asset-has-warranty" className="cursor-pointer">
                {t("assets.form.hasWarranty")}
              </Label>
            </div>
            {hasWarranty && (
              <div className="grid gap-3 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  {t("assets.form.warrantyHint")}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="asset-active-date">
                      {t("assets.form.activeDate")}
                    </Label>
                    <Input
                      id="asset-active-date"
                      type="date"
                      value={warranty.activeDate}
                      onChange={(e) => warranty.setActiveDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="asset-warranty-period">
                      {t("assets.form.warrantyPeriod")}
                    </Label>
                    <Input
                      id="asset-warranty-period"
                      type="number"
                      min="1"
                      value={warranty.warrantyPeriod}
                      onChange={(e) => warranty.setWarrantyPeriod(e.target.value)}
                      placeholder={t("assets.form.warrantyPeriodPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="asset-expiration-date">
                      {t("assets.form.expirationDate")}
                    </Label>
                    <Input
                      id="asset-expiration-date"
                      type="date"
                      value={warranty.expirationDate}
                      onChange={(e) => warranty.setExpirationDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="asset-note">{t("assets.form.note")}</Label>
              <textarea
                id="asset-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("assets.form.notePlaceholder")}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
      <AssetCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
      <AssetPlaceManagerDialog
        open={placeManagerOpen}
        onClose={() => setPlaceManagerOpen(false)}
      />
      <AssetStoreManagerDialog
        open={storeManagerOpen}
        onClose={() => setStoreManagerOpen(false)}
      />
    </>
  );
};

export default CreateAssetDialog;
