import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import type { AssetCategory } from "@/api/assetCategories";
import type { AssetPlace } from "@/api/assetPlaces";
import type { AssetStore } from "@/api/assetStores";
import type { Asset } from "@/api/assets";
import { getAssetById, updateAsset } from "@/api/assets";
import { getErrorMessage } from "@/lib/error";
import { useWarrantyDateCalc } from "@/hooks/useWarrantyDateCalc";
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
import AssetPlaceManagerDialog from "./AssetPlaceManagerDialog";
import AssetStoreManagerDialog from "./AssetStoreManagerDialog";

interface EditAssetDialogProps {
  readonly open: boolean;
  readonly asset: Asset | null;
  readonly categories: AssetCategory[];
  readonly places: AssetPlace[];
  readonly stores: AssetStore[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly onRefDataChanged: () => void;
}

const EditAssetDialog = ({
  open,
  asset,
  categories,
  places,
  stores,
  onClose,
  onSuccess,
  onRefDataChanged,
}: EditAssetDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<number | null>(null);
  const [inUse, setInUse] = useState(true);
  const [price, setPrice] = useState("");
  const [shopDate, setShopDate] = useState("");
  const [storeId, setStoreId] = useState<number | null>(null);
  const [hasWarranty, setHasWarranty] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placeManagerOpen, setPlaceManagerOpen] = useState(false);
  const [storeManagerOpen, setStoreManagerOpen] = useState(false);

  const warranty = useWarrantyDateCalc();

  const [prevAssetId, setPrevAssetId] = useState(asset?.id);
  if (asset?.id !== prevAssetId) {
    setPrevAssetId(asset?.id);
    if (asset) {
      setName(asset.name);
      setBarcode(asset.barcode ?? "");
      setSerialNumber(asset.serialNumber ?? "");
      setCategoryId(asset.categoryId);
      setPlaceId(asset.placeId);
      setInUse(asset.inUse);
      setPrice(asset.price != null ? String(asset.price) : "");
      setShopDate(asset.shopDate ?? "");
      setStoreId(asset.storeId);
      setHasWarranty(asset.hasWarranty);
      setNote(asset.note ?? "");
      if (asset.hasWarranty) {
        void getAssetById(asset.id).then(({ data: detail }) => {
          warranty.initDates(
            detail.activeDate ?? "",
            detail.expirationDate ?? "",
            detail.warrantyPeriod ?? 0,
          );
        });
      } else {
        warranty.resetDates();
      }
    }
    setError("");
  }

  const handleClose = () => {
    setError("");
    setPlaceManagerOpen(false);
    setStoreManagerOpen(false);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !asset || !categoryId || !placeId) return;
    setError("");
    setSubmitting(true);

    try {
      await updateAsset(asset.id, {
        name,
        barcode: barcode || undefined,
        serialNumber: serialNumber || undefined,
        categoryId,
        placeId,
        inUse,
        price: price ? Number.parseFloat(price) : undefined,
        shopDate: shopDate || undefined,
        storeId: storeId ?? undefined,
        hasWarranty,
        activeDate: hasWarranty ? warranty.activeDate || undefined : undefined,
        warrantyPeriod: hasWarranty && warranty.warrantyPeriod ? Number.parseInt(warranty.warrantyPeriod, 10) : undefined,
        expirationDate: hasWarranty ? warranty.expirationDate || undefined : undefined,
        note: note || undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("assets.edit")}</DialogTitle>
            <DialogDescription>
              {t("assets.editDescription", { name: asset.name })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-name">{t("assets.form.name")}</Label>
              <Input
                id="edit-asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-asset-barcode">{t("assets.form.barcode")}</Label>
                <Input
                  id="edit-asset-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder={t("assets.form.barcodePlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-asset-serial">{t("assets.form.serialNumber")}</Label>
                <Input
                  id="edit-asset-serial"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder={t("assets.form.serialNumberPlaceholder")}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("assets.form.category")}</Label>
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
                <Label htmlFor="edit-asset-price">{t("assets.form.price")}</Label>
                <Input
                  id="edit-asset-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t("assets.form.pricePlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-asset-shop-date">{t("assets.form.shopDate")}</Label>
                <Input
                  id="edit-asset-shop-date"
                  type="date"
                  value={shopDate}
                  onChange={(e) => setShopDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-asset-in-use"
                type="checkbox"
                checked={inUse}
                onChange={(e) => setInUse(e.target.checked)}
                className="size-4 rounded"
              />
              <Label htmlFor="edit-asset-in-use" className="cursor-pointer">
                {t("assets.form.inUse")}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-asset-has-warranty"
                type="checkbox"
                checked={hasWarranty}
                onChange={(e) => {
                  setHasWarranty(e.target.checked);
                  if (!e.target.checked) warranty.resetDates();
                }}
                className="size-4 rounded"
              />
              <Label htmlFor="edit-asset-has-warranty" className="cursor-pointer">
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
                    <Label htmlFor="edit-asset-active-date">
                      {t("assets.form.activeDate")}
                    </Label>
                    <Input
                      id="edit-asset-active-date"
                      type="date"
                      value={warranty.activeDate}
                      onChange={(e) => warranty.setActiveDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-asset-warranty-period">
                      {t("assets.form.warrantyPeriod")}
                    </Label>
                    <Input
                      id="edit-asset-warranty-period"
                      type="number"
                      min="1"
                      value={warranty.warrantyPeriod}
                      onChange={(e) => warranty.setWarrantyPeriod(e.target.value)}
                      placeholder={t("assets.form.warrantyPeriodPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-asset-expiration-date">
                      {t("assets.form.expirationDate")}
                    </Label>
                    <Input
                      id="edit-asset-expiration-date"
                      type="date"
                      value={warranty.expirationDate}
                      onChange={(e) => warranty.setExpirationDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-note">{t("assets.form.note")}</Label>
              <textarea
                id="edit-asset-note"
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
                {submitting ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AssetPlaceManagerDialog
        open={placeManagerOpen}
        onClose={() => setPlaceManagerOpen(false)}
        onChanged={onRefDataChanged}
      />
      <AssetStoreManagerDialog
        open={storeManagerOpen}
        onClose={() => setStoreManagerOpen(false)}
        onChanged={onRefDataChanged}
      />
    </>
  );
};

export default EditAssetDialog;
