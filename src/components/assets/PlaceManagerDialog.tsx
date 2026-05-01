import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  type Place,
} from "@/api/places";
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

interface PlaceManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}

type Mode = "list" | "create" | "edit";

const PlaceManagerDialog = ({
  open,
  onClose,
  onChanged,
}: PlaceManagerDialogProps) => {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPlaces();
      setPlaces(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchPlaces();
  }, [open, fetchPlaces]);

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

  const handleStartEdit = (place: Place) => {
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
        await createPlace({ name, description: description || undefined });
      } else if (mode === "edit" && editingPlace) {
        await updatePlace(editingPlace.id, { name, description });
      }
      resetForm();
      void fetchPlaces();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.places.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (place: Place) => {
    try {
      await deletePlace(place.id);
      void fetchPlaces();
      onChanged();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.places.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assets.places.manage")}</DialogTitle>
          <DialogDescription>
            {t("assets.places.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("assets.places.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("assets.places.columns.name")}</TableHead>
                    <TableHead>
                      {t("assets.places.columns.description")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("assets.places.columns.actions")}
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
                  {!loading && places.length === 0 && (
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
                              onClick={() => handleDelete(p)}
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
                {t("assets.places.form.name")}
              </Label>
              <Input
                id="place-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.places.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="place-description">
                {t("assets.places.form.description")}
              </Label>
              <Input
                id="place-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("assets.places.form.descriptionPlaceholder")}
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

export default PlaceManagerDialog;
