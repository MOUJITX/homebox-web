import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createBookSeries,
  updateBookSeries,
  deleteBookSeries,
  type BookSeries,
} from "@/api/bookSeries";
import { getErrorMessage } from "@/lib/error";
import { useBookSeries } from "@/hooks/queries/useBookSeries";
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

interface BookSeriesManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const BookSeriesManagerDialog = ({
  open,
  onClose,
}: BookSeriesManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: series = [], isLoading } = useBookSeries();
  const invalidate = useInvalidateBooks();
  const [mode, setMode] = useState<Mode>("list");
  const [editingSeries, setEditingSeries] = useState<BookSeries | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError("");
    setMode("list");
    setEditingSeries(null);
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

  const handleStartEdit = (s: BookSeries) => {
    setEditingSeries(s);
    setName(s.name);
    setDescription(s.description ?? "");
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
        await createBookSeries({
          name,
          description: description || undefined,
        });
      } else if (mode === "edit" && editingSeries) {
        await updateBookSeries(editingSeries.id, { name, description });
      }
      resetForm();
      void invalidate.invalidateSeries();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("books.series.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: BookSeries) => {
    try {
      await deleteBookSeries(s.id);
      void invalidate.invalidateSeries();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("books.series.errors.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("books.series.manage")}</DialogTitle>
          <DialogDescription>
            {t("books.series.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("books.series.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("books.series.columns.name")}</TableHead>
                    <TableHead>
                      {t("books.series.columns.description")}
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
                  {!isLoading && series.length === 0 && (
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
                    series.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.description || "\u2014"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleStartEdit(s)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => void handleDelete(s)}
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
              <Label htmlFor="series-name">{t("books.series.form.name")}</Label>
              <Input
                id="series-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("books.series.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="series-description">
                {t("books.series.form.description")}
              </Label>
              <Input
                id="series-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("books.series.form.descriptionPlaceholder")}
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

export default BookSeriesManagerDialog;
