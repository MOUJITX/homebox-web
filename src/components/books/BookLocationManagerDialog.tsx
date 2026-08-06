import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createBookLocation,
  updateBookLocation,
  deleteBookLocation,
  type BookLocation,
} from "@/api/bookLocations";
import { getErrorMessage } from "@/lib/error";
import { useBookLocations } from "@/hooks/queries/useBookLocations";
import { useInvalidateBooks } from "@/hooks/queries/useInvalidateBooks";
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

interface BookLocationManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const BookLocationManagerDialog = ({
  open,
  onClose,
}: BookLocationManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: locations = [], isLoading } = useBookLocations();
  const invalidate = useInvalidateBooks();
  const [mode, setMode] = useState<Mode>("list");
  const [editingLocation, setEditingLocation] = useState<BookLocation | null>(
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
    setEditingLocation(null);
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

  const handleStartEdit = (location: BookLocation) => {
    setEditingLocation(location);
    setName(location.name);
    setDescription(location.description ?? "");
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
        await createBookLocation({
          name,
          description: description || undefined,
        });
      } else if (mode === "edit" && editingLocation) {
        await updateBookLocation(editingLocation.id, { name, description });
      }
      resetForm();
      void invalidate.invalidateLocations();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("books.locations.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location: BookLocation) => {
    try {
      await deleteBookLocation(location.id);
      void invalidate.invalidateLocations();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("books.locations.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("books.locations.manage")}</DialogTitle>
          <DialogDescription>
            {t("books.locations.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("books.locations.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("books.locations.columns.name")}</TableHead>
                    <TableHead>
                      {t("books.locations.columns.description")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
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
                  {!isLoading && locations.length === 0 && (
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
                    locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">
                          {loc.name}
                        </TableCell>
                        <TableCell>{loc.description || "\u2014"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleStartEdit(loc)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => void handleDelete(loc)}
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
              <Label htmlFor="location-name">
                {t("books.locations.form.name")}
              </Label>
              <Input
                id="location-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("books.locations.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location-description">
                {t("books.locations.form.description")}
              </Label>
              <Input
                id="location-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("books.locations.form.descriptionPlaceholder")}
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

export default BookLocationManagerDialog;
