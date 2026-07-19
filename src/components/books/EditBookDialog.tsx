import { useState, type SubmitEvent, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import { updateBook, type BookDetail } from "@/api/books";
import { getErrorMessage } from "@/lib/error";
import { useBookCategories } from "@/hooks/queries/useBookCategories";
import { useBookLocations } from "@/hooks/queries/useBookLocations";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import BookCategoryManagerDialog from "./BookCategoryManagerDialog";
import BookLocationManagerDialog from "./BookLocationManagerDialog";

interface EditBookDialogProps {
  readonly open: boolean;
  readonly book: BookDetail | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: "WANT_TO_READ", label: "books.statuses.WANT_TO_READ" },
  { value: "READING", label: "books.statuses.READING" },
  { value: "READ", label: "books.statuses.READ" },
];

const EditBookDialog = ({
  open,
  book,
  onClose,
  onSuccess,
}: EditBookDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useBookCategories();
  const { data: locations = [] } = useBookLocations();
  const { data: allSeries = [] } = useBookSeries();
  const invalidate = useInvalidateBooks();

  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const [serialized, setSerialized] = useState(book?.serialized ?? false);
  const [issueNumber, setIssueNumber] = useState(book?.issueNumber ?? "");
  const [publisher, setPublisher] = useState(book?.publisher ?? "");
  const [publishDate, setPublishDate] = useState(book?.publishDate ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(book?.categoryId ?? null);
  const [locationId, setLocationId] = useState<number | null>(book?.locationId ?? null);
  const [status, setStatus] = useState(book?.status ?? "WANT_TO_READ");
  const [purchaseDate, setPurchaseDate] = useState(book?.purchaseDate ?? "");
  const [purchasePrice, setPurchasePrice] = useState(book?.purchasePrice?.toString() ?? "");
  const [note, setNote] = useState(book?.note ?? "");
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<number[]>(
    book?.series?.map((s) => s.id) ?? [],
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [locationManagerOpen, setLocationManagerOpen] = useState(false);

  const resetForm = () => {
    setTitle(book?.title ?? "");
    setAuthor(book?.author ?? "");
    setIsbn(book?.isbn ?? "");
    setSerialized(book?.serialized ?? false);
    setIssueNumber(book?.issueNumber ?? "");
    setPublisher(book?.publisher ?? "");
    setPublishDate(book?.publishDate ?? "");
    setDescription(book?.description ?? "");
    setCategoryId(book?.categoryId ?? null);
    setLocationId(book?.locationId ?? null);
    setStatus(book?.status ?? "WANT_TO_READ");
    setPurchaseDate(book?.purchaseDate ?? "");
    setPurchasePrice(book?.purchasePrice?.toString() ?? "");
    setNote(book?.note ?? "");
    setSelectedSeriesIds(book?.series?.map((s) => s.id) ?? []);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    setCategoryManagerOpen(false);
    setLocationManagerOpen(false);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !book || !categoryId || !locationId) return;
    setError("");
    setSubmitting(true);

    try {
      await updateBook(book.id, {
        title,
        author: author || undefined,
        isbn: isbn || undefined,
        serialized: book.parentId ? undefined : serialized,
        issueNumber: book.parentId ? issueNumber || undefined : undefined,
        publisher: publisher || undefined,
        publishDate: publishDate || undefined,
        description: description || undefined,
        categoryId,
        locationId,
        status,
        purchaseDate: purchaseDate || undefined,
        purchasePrice: purchasePrice
          ? Number.parseFloat(purchasePrice)
          : undefined,
        note: note || undefined,
        seriesIds: selectedSeriesIds,
      });
      handleClose();
      void invalidate.invalidateList();
      void invalidate.invalidateDetail(book.id);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("books.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!book) return null;

  const isChild = !!book.parentId;

  return (
    <>
      <Dialog key={book?.id ?? "new"} open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("books.editBook")}</DialogTitle>
            <DialogDescription>{book.title}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">
                  {t("books.title_")} *
                </Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-author">{t("books.author")}</Label>
                <Input
                  id="edit-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t("books.authorHint")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-isbn">{t("books.isbnOptional")}</Label>
                <Input
                  id="edit-isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                />
              </div>
              {isChild && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-issue">{t("books.issueNumber")} *</Label>
                  <Input
                    id="edit-issue"
                    value={issueNumber}
                    onChange={(e) => setIssueNumber(e.target.value)}
                    placeholder={t("books.issueNumberHint")}
                    required
                  />
                </div>
              )}
            </div>

            {!isChild && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-serialized"
                  checked={serialized}
                  onCheckedChange={(v) => setSerialized(!!v)}
                />
                <Label htmlFor="edit-serialized" className="cursor-pointer">
                  {t("books.serialized")}
                </Label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-publisher">{t("books.publisher")}</Label>
                <Input
                  id="edit-publisher"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-publish-date">
                  {t("books.publishDate")}
                </Label>
                <Input
                  id="edit-publish-date"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">
                {t("books.description")}
              </Label>
              <textarea
                id="edit-description"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>
                  {t("books.category")} *
                </Label>
                <div className="flex gap-1">
                  <SearchableSelect
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder={t("books.category")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCategoryManagerOpen(true)}
                  >
                    <PlusIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>
                  {t("books.location")} *
                </Label>
                <div className="flex gap-1">
                  <SearchableSelect
                    options={locations.map((l) => ({
                      value: l.id,
                      label: l.name,
                    }))}
                    value={locationId}
                    onChange={setLocationId}
                    placeholder={t("books.location")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setLocationManagerOpen(true)}
                  >
                    <PlusIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t("books.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) => v && setStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {() => t(STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.label)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-purchase-date">
                  {t("books.purchaseDate")}
                </Label>
                <Input
                  id="edit-purchase-date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-purchase-price">
                {t("books.purchasePrice")}
              </Label>
              <Input
                id="edit-purchase-price"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            {!isChild && allSeries.length > 0 && (
              <div className="grid gap-2">
                <Label>{t("books.series.belongTo")}</Label>
                <div className="flex flex-wrap gap-2">
                  {allSeries.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <Checkbox
                        checked={selectedSeriesIds.includes(s.id)}
                        onCheckedChange={(v) => {
                          if (v) {
                            setSelectedSeriesIds([
                              ...selectedSeriesIds,
                              s.id,
                            ]);
                          } else {
                            setSelectedSeriesIds(
                              selectedSeriesIds.filter((id) => id !== s.id),
                            );
                          }
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-note">{t("books.note")}</Label>
              <textarea
                id="edit-note"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={note}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setNote(e.target.value)
                }
                rows={2}
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

      <BookCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
      <BookLocationManagerDialog
        open={locationManagerOpen}
        onClose={() => setLocationManagerOpen(false)}
      />
    </>
  );
};

export default EditBookDialog;
