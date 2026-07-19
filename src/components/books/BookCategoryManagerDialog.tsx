import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createBookCategory,
  updateBookCategory,
  deleteBookCategory,
  type BookCategory,
} from "@/api/bookCategories";
import { getErrorMessage } from "@/lib/error";
import { useBookCategories } from "@/hooks/queries/useBookCategories";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface BookCategoryManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const BookCategoryManagerDialog = ({
  open,
  onClose,
}: BookCategoryManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useBookCategories();
  const invalidate = useInvalidateBooks();
  const [mode, setMode] = useState<Mode>("list");
  const [editingCategory, setEditingCategory] = useState<BookCategory | null>(
    null,
  );
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [serialized, setSerialized] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setKey("");
    setSerialized(false);
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
    setKey("");
    setSerialized(false);
    setDescription("");
    setError("");
    setMode("create");
  };

  const handleStartEdit = (category: BookCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setKey(category.key);
    setSerialized(category.serialized);
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
        await createBookCategory({
          name,
          key,
          serialized,
          description: description || undefined,
        });
      } else if (mode === "edit" && editingCategory) {
        await updateBookCategory(editingCategory.id, {
          name,
          key,
          serialized,
          description,
        });
      }
      resetForm();
      void invalidate.invalidateCategories();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("books.categories.errors.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: BookCategory) => {
    try {
      await deleteBookCategory(category.id);
      void invalidate.invalidateCategories();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("books.categories.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("books.categories.manage")}</DialogTitle>
          <DialogDescription>
            {t("books.categories.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("books.categories.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("books.categories.columns.name")}
                    </TableHead>
                    <TableHead>
                      {t("books.categories.columns.key")}
                    </TableHead>
                    <TableHead>
                      {t("books.categories.columns.serialized")}
                    </TableHead>
                    <TableHead>
                      {t("books.categories.columns.description")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-16 text-center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && categories.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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
                        <TableCell>{c.key}</TableCell>
                        <TableCell>
                          {c.serialized ? t("common.yes") : t("common.no")}
                        </TableCell>
                        <TableCell>{c.description || "\u2014"}</TableCell>
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
                {t("books.categories.form.name")}
              </Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("books.categories.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-key">
                {t("books.categories.form.key")}
              </Label>
              <Input
                id="category-key"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder={t("books.categories.form.keyPlaceholder")}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="category-serialized"
                checked={serialized}
                onCheckedChange={(checked) => setSerialized(Boolean(checked))}
              />
              <Label htmlFor="category-serialized">
                {t("books.categories.form.serialized")}
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">
                {t("books.categories.form.description")}
              </Label>
              <Input
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "books.categories.form.descriptionPlaceholder",
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

export default BookCategoryManagerDialog;
