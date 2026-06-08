import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
  type AssetCategory,
} from "@/api/assetCategories";
import { getErrorMessage } from "@/lib/error";
import { useAssetCategories } from "@/hooks/queries/useAssetCategories";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface AssetCategoryManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const AssetCategoryManagerDialog = ({
  open,
  onClose,
}: AssetCategoryManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useAssetCategories();
  const invalidate = useInvalidateAssets();
  const [mode, setMode] = useState<Mode>("list");
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError("");
    setMode("list");
    setEditingCategory(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleStartCreate = () => {
    setName("");
    setDescription("");
    setError("");
    setMode("create");
  };

  const handleStartEdit = (category: AssetCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
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
        await createAssetCategory({
          name,
          description: description || undefined,
        });
      } else if (mode === "edit" && editingCategory) {
        await updateAssetCategory(editingCategory.id, { name, description });
      }
      resetForm();
      void invalidate.invalidateCategories();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.assetCategories.errors.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: AssetCategory) => {
    try {
      await deleteAssetCategory(category.id);
      void invalidate.invalidateCategories();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.assetCategories.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assets.assetCategories.manage")}</DialogTitle>
          <DialogDescription>
            {t("assets.assetCategories.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("assets.assetCategories.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("assets.assetCategories.columns.name")}
                    </TableHead>
                    <TableHead>
                      {t("assets.assetCategories.columns.description")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("assets.assetCategories.columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && categories.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-16 text-center text-muted-foreground"
                      >
                        {t("common.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    categories.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleStartEdit(c)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => void handleDelete(c)}
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
              <Label htmlFor="category-name">
                {t("assets.assetCategories.form.name")}
              </Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.assetCategories.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">
                {t("assets.assetCategories.form.description")}
              </Label>
              <Input
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "assets.assetCategories.form.descriptionPlaceholder",
                )}
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

export default AssetCategoryManagerDialog;
