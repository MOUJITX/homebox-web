import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  getGoodBrands,
  createGoodBrand,
  updateGoodBrand,
  deleteGoodBrand,
  type GoodBrand,
} from "@/api/goodBrands";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface BrandManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}

type Mode = "list" | "create" | "edit";

const BrandManagerDialog = ({
  open,
  onClose,
  onChanged,
}: BrandManagerDialogProps) => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<GoodBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingBrand, setEditingBrand] = useState<GoodBrand | null>(null);
  const [brandName, setBrandName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGoodBrands();
      setBrands(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchBrands();
  }, [open, fetchBrands]);

  const resetForm = () => {
    setBrandName("");
    setCompanyName("");
    setError("");
    setMode("list");
    setEditingBrand(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleStartCreate = () => {
    setBrandName("");
    setCompanyName("");
    setError("");
    setMode("create");
  };

  const handleStartEdit = (brand: GoodBrand) => {
    setEditingBrand(brand);
    setBrandName(brand.brandName);
    setCompanyName(brand.companyName ?? "");
    setError("");
    setMode("edit");
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      if (mode === "create") {
        await createGoodBrand({
          brandName,
          companyName: companyName || undefined,
        });
      } else if (mode === "edit" && editingBrand) {
        await updateGoodBrand(editingBrand.id, {
          brandName,
          companyName: companyName || undefined,
        });
      }
      resetForm();
      void fetchBrands();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.brands.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (brand: GoodBrand) => {
    try {
      await deleteGoodBrand(brand.id);
      void fetchBrands();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.brands.errors.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("goods.brands.manage")}</DialogTitle>
          <DialogDescription>
            {t("goods.brands.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("goods.brands.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("goods.brands.columns.brandName")}</TableHead>
                    <TableHead>
                      {t("goods.brands.columns.companyName")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("goods.brands.columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && brands.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-16 text-center text-muted-foreground"
                      >
                        {t("common.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">
                          {brand.brandName}
                        </TableCell>
                        <TableCell>{brand.companyName || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleStartEdit(brand)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(brand)}
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}

        {(mode === "create" || mode === "edit") && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="brand-name">
                {t("goods.brands.form.brandName")}
              </Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={t("goods.brands.form.brandNamePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand-company">
                {t("goods.brands.form.companyName")}
              </Label>
              <Input
                id="brand-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("goods.brands.form.companyNamePlaceholder")}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BrandManagerDialog;
