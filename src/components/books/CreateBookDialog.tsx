import { useState, useEffect, useRef, type SubmitEvent } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, SearchIcon } from "lucide-react";
import { createBook, lookupDouban, checkIsbn } from "@/api/books";
import type { DoubanLookupResult, IsbnCheckResult } from "@/api/books";
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

interface CreateBookDialogProps {
  readonly open: boolean;
  readonly parentId?: number | null;
  readonly parentBarcode?: string | null;
  readonly parentFields?: {
    categoryId: number;
    locationId: number;
  } | null;
  readonly preFill?: {
    categoryId: number;
    serialized: boolean;
  } | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: "WANT_TO_READ", label: "books.statuses.WANT_TO_READ" },
  { value: "READING", label: "books.statuses.READING" },
  { value: "READ", label: "books.statuses.READ" },
];

const CreateBookDialog = ({
  open,
  parentId = null,
  parentBarcode = null,
  parentFields = null,
  preFill = null,
  onClose,
  onSuccess,
}: CreateBookDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useBookCategories();
  const { data: locations = [] } = useBookLocations();
  const { data: allSeries = [] } = useBookSeries();
  const invalidate = useInvalidateBooks();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [serialized, setSerialized] = useState(preFill?.serialized ?? false);
  const [issueNumber, setIssueNumber] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(
    parentFields?.categoryId ?? preFill?.categoryId ?? null,
  );
  const [locationId, setLocationId] = useState<number | null>(null);
  const [status, setStatus] = useState("WANT_TO_READ");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [note, setNote] = useState("");
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [locationManagerOpen, setLocationManagerOpen] = useState(false);

  const [doubanQuery, setDoubanQuery] = useState("");
  const [doubanLoading, setDoubanLoading] = useState(false);
  const [doubanCandidates, setDoubanCandidates] = useState<
    DoubanLookupResult[] | null
  >(null);

  const [isbnExisting, setIsbnExisting] = useState<IsbnCheckResult | null>(
    null,
  );
  const isbnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (preFill) {
      setCategoryId(preFill.categoryId);
      setSerialized(preFill.serialized);
    }
  }, [open, preFill]);

  useEffect(() => {
    if (isbnTimerRef.current) {
      clearTimeout(isbnTimerRef.current);
    }
    if (!isbn || isbn.length < 10) {
      setIsbnExisting(null);
      return;
    }
    isbnTimerRef.current = setTimeout(() => {
      checkIsbn(isbn)
        .then(({ data }) => setIsbnExisting(data))
        .catch(() => setIsbnExisting(null));
    }, 400);
  }, [isbn]);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setSerialized(false);
    setIssueNumber("");
    setPublisher("");
    setPublishDate("");
    setDescription("");
    setCategoryId(parentFields?.categoryId ?? null);
    setLocationId(parentFields?.locationId ?? null);
    setStatus("WANT_TO_READ");
    setPurchaseDate("");
    setPurchasePrice("");
    setNote("");
    setSelectedSeriesIds([]);
    setError("");
    setDoubanQuery("");
    setDoubanCandidates(null);
    setIsbnExisting(null);
  };

  const handleClose = () => {
    resetForm();
    setCategoryManagerOpen(false);
    setLocationManagerOpen(false);
    onClose();
  };

  const fillFromDouban = (result: DoubanLookupResult) => {
    if (result.title) setTitle(result.title);
    if (result.author) setAuthor(result.author);
    if (result.publisher) setPublisher(result.publisher);
    if (result.publishDate) setPublishDate(result.publishDate);
    if (result.description) setDescription(result.description);
    if (result.isbn) setIsbn(result.isbn);
    setDoubanCandidates(null);
    setDoubanQuery("");
  };

  const handleDoubanLookup = async () => {
    if (!doubanQuery.trim() || doubanLoading) return;
    setDoubanLoading(true);
    setDoubanCandidates(null);
    try {
      const params: Record<string, string> = {};
      if (/^\d{10,13}$/.test(doubanQuery.trim())) {
        params.isbn = doubanQuery.trim();
      } else {
        params.q = doubanQuery.trim();
      }
      const { data } = await lookupDouban(params);
      if (data.candidates && data.candidates.length > 0) {
        setDoubanCandidates(data.candidates);
      } else if (data.title) {
        fillFromDouban(data);
      } else {
        setError(t("books.doubanNoResult"));
      }
    } catch {
      setError(t("books.doubanFetchError"));
    } finally {
      setDoubanLoading(false);
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !categoryId || !locationId) return;
    setError("");
    setSubmitting(true);

    try {
      await createBook({
        title,
        author: author || undefined,
        isbn: isbn || undefined,
        serialized: parentId ? false : serialized,
        parentId: parentId ?? undefined,
        issueNumber: parentId ? issueNumber || undefined : undefined,
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
        seriesIds: selectedSeriesIds.length > 0 ? selectedSeriesIds : undefined,
      });
      handleClose();
      void invalidate.invalidateList();
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("books.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {parentId ? t("books.addChildBook") : t("books.addBook")}
            </DialogTitle>
            <DialogDescription>
              {parentId
                ? `${t("books.parentBook")}: ${parentBarcode}`
                : t("books.addBookDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {!parentId && (
              <div className="flex gap-2">
                <Input
                  placeholder={t("books.doubanSearchPlaceholder")}
                  value={doubanQuery}
                  onChange={(e) => setDoubanQuery(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && e.preventDefault()
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={doubanLoading || !doubanQuery.trim()}
                  onClick={() => void handleDoubanLookup()}
                >
                  <SearchIcon className="size-4" />
                </Button>
              </div>
            )}

            {doubanCandidates && (
              <div className="max-h-32 overflow-y-auto rounded-lg ring-1 ring-foreground/10 p-2">
                {doubanCandidates.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    onClick={() => fillFromDouban(c)}
                  >
                    {c.title} — {c.author}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="book-title">
                  {t("books.title_")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="book-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="book-author">{t("books.author")}</Label>
                <Input
                  id="book-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t("books.authorHint")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="book-isbn">{t("books.isbnOptional")}</Label>
                <Input
                  id="book-isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                />
                {isbnExisting && isbnExisting.count > 0 && (
                  <p className="text-xs text-amber-500">
                    {t("books.isbnDuplicateWarning", {
                      count: isbnExisting.count,
                      titles: isbnExisting.titles.slice(0, 3).join("、"),
                    })}
                  </p>
                )}
              </div>
              {parentId && (
                <div className="grid gap-2">
                  <Label htmlFor="book-issue">
                    {t("books.issueNumber")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="book-issue"
                    value={issueNumber}
                    onChange={(e) => setIssueNumber(e.target.value)}
                    placeholder={t("books.issueNumberHint")}
                    required
                  />
                </div>
              )}
            </div>

            {!parentId && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="book-serialized"
                  checked={serialized}
                  onCheckedChange={(v) => setSerialized(!!v)}
                />
                <Label htmlFor="book-serialized" className="cursor-pointer">
                  {t("books.serialized")}
                </Label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="book-publisher">{t("books.publisher")}</Label>
                <Input
                  id="book-publisher"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="book-publish-date">
                  {t("books.publishDate")}
                </Label>
                <Input
                  id="book-publish-date"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="book-description">{t("books.description")}</Label>
              <textarea
                id="book-description"
                className="flex min-h-20 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>
                  {t("books.category")}{" "}
                  <span className="text-destructive">*</span>
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
                  {t("books.location")}{" "}
                  <span className="text-destructive">*</span>
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
                <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue>
                      {() =>
                        t(
                          STATUS_OPTIONS.find((o) => o.value === status)
                            ?.label ?? "",
                        )
                      }
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
                <Label htmlFor="book-purchase-date">
                  {t("books.purchaseDate")}
                </Label>
                <Input
                  id="book-purchase-date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="book-purchase-price">
                {t("books.purchasePrice")}
              </Label>
              <Input
                id="book-purchase-price"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            {!parentId && allSeries.length > 0 && (
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
                            setSelectedSeriesIds([...selectedSeriesIds, s.id]);
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
              <Label htmlFor="book-note">{t("books.note")}</Label>
              <textarea
                id="book-note"
                className="flex min-h-20 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
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
                {submitting ? t("common.creating") : t("common.create")}
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

export default CreateBookDialog;
