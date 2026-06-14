import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createDocumentCategory,
  updateDocumentCategory,
  deleteDocumentCategory,
  type DocumentCategory,
} from "@/api/documentCategories";
import { getErrorMessage } from "@/lib/error";
import { useDocumentCategories } from "@/hooks/queries/useDocumentCategories";
import { useInvalidateDocuments } from "@/hooks/queries/useInvalidateDocuments";
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

interface DocumentCategoryManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const DocumentCategoryManagerDialog = ({
  open,
  onClose,
}: DocumentCategoryManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useDocumentCategories();
  const invalidate = useInvalidateDocuments();
  const [mode, setMode] = useState<Mode>("list");
  const [editingCategory, setEditingCategory] =
    useState<DocumentCategory | null>(null);
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

  const handleStartEdit = (category: DocumentCategory) => {
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
        await createDocumentCategory({
          name,
          description: description || undefined,
        });
      } else if (mode === "edit" && editingCategory) {
        await updateDocumentCategory(editingCategory.id, {
          name,
          description,
        });
      }
      resetForm();
      void invalidate.invalidateCategories();
    } catch (err) {
      setError(
        getErrorMessage(err) ??
          t("archives.categories.errors.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: DocumentCategory) => {
    try {
      await deleteDocumentCategory(category.id);
      void invalidate.invalidateCategories();
    } catch (err) {
      setError(
        getErrorMessage(err) ??
          t("archives.categories.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("archives.categories.manage")}</DialogTitle>
          <DialogDescription>
            {t("archives.categories.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("archives.categories.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("archives.categories.name")}
                    </TableHead>
                    <TableHead>
                      {t("archives.categories.description")}
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
                        <TableCell className="font-medium">
                          {c.name}
                        </TableCell>
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
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            )}
          </div>
        )}

        {(mode === "create" || mode === "edit") && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">
                {t("archives.categories.name")}
              </Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("archives.categories.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">
                {t("archives.categories.description")}
              </Label>
              <Input
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "archives.categories.descriptionPlaceholder",
                )}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
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

export default DocumentCategoryManagerDialog;
