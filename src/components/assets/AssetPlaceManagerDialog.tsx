import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createAssetPlace,
  updateAssetPlace,
  deleteAssetPlace,
  type AssetPlace,
} from "@/api/assetPlaces";
import { getErrorMessage } from "@/lib/error";
import { useAssetPlaces } from "@/hooks/queries/useAssetPlaces";
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

interface AssetPlaceManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const AssetPlaceManagerDialog = ({
  open,
  onClose,
}: AssetPlaceManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: places = [], isLoading } = useAssetPlaces();
  const invalidate = useInvalidateAssets();
  const [mode, setMode] = useState<Mode>("list");
  const [editingPlace, setEditingPlace] = useState<AssetPlace | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError("");
    setMode("list");
    setEditingPlace(null);
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

  const handleStartEdit = (place: AssetPlace) => {
    setEditingPlace(place);
    setName(place.name);
    setDescription(place.description ?? "");
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
        await createAssetPlace({ name, description: description || undefined });
      } else if (mode === "edit" && editingPlace) {
        await updateAssetPlace(editingPlace.id, { name, description });
      }
      resetForm();
      void invalidate.invalidatePlaces();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.assetPlaces.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (place: AssetPlace) => {
    try {
      await deleteAssetPlace(place.id);
      void invalidate.invalidatePlaces();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.assetPlaces.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assets.assetPlaces.manage")}</DialogTitle>
          <DialogDescription>
            {t("assets.assetPlaces.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("assets.assetPlaces.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("assets.assetPlaces.columns.name")}</TableHead>
                    <TableHead>
                      {t("assets.assetPlaces.columns.description")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("assets.assetPlaces.columns.actions")}
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
                  {!isLoading && places.length === 0 && (
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
                    places.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.name}
                        </TableCell>
                        <TableCell>{p.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleStartEdit(p)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => void handleDelete(p)}
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
              <Label htmlFor="place-name">
                {t("assets.assetPlaces.form.name")}
              </Label>
              <Input
                id="place-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.assetPlaces.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="place-description">
                {t("assets.assetPlaces.form.description")}
              </Label>
              <Input
                id="place-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("assets.assetPlaces.form.descriptionPlaceholder")}
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

export default AssetPlaceManagerDialog;
