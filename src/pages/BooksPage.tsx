import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ColumnsIcon,
  LayoutGridIcon,
  MapPinIcon,
  BookIcon,
} from "lucide-react";
import type { Book, BookStatus, Page } from "@/api/books";
import { useDebounce } from "@/hooks/useDebounce";
import { useBookCategories } from "@/hooks/queries/useBookCategories";
import { useBookLocations } from "@/hooks/queries/useBookLocations";
import { useBookSeries } from "@/hooks/queries/useBookSeries";
import { useBooks } from "@/hooks/queries/useBooks";
import { bookKeys } from "@/hooks/queries/bookKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import CreateBookDialog from "@/components/books/CreateBookDialog";
import EditBookDialog from "@/components/books/EditBookDialog";
import DeleteBookDialog from "@/components/books/DeleteBookDialog";
import BookDetailDrawer from "@/components/books/BookDetailDrawer";
import BookCategoryManagerDialog from "@/components/books/BookCategoryManagerDialog";
import BookLocationManagerDialog from "@/components/books/BookLocationManagerDialog";
import BookSeriesManagerDialog from "@/components/books/BookSeriesManagerDialog";

import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "books.statuses.allStatuses" },
  { value: "WANT_TO_READ", label: "books.statuses.WANT_TO_READ" },
  { value: "READING", label: "books.statuses.READING" },
  { value: "READ", label: "books.statuses.READ" },
];

const EMPTY_PAGE: Page<Book> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE_OPTIONS[0],
  number: 0,
  first: true,
  last: true,
  empty: true,
};

const statusBadgeVariant = (
  status: BookStatus,
): "success" | "warning" | "secondary" => {
  switch (status) {
    case "READING":
      return "success";
    case "WANT_TO_READ":
      return "warning";
    case "READ":
      return "secondary";
  }
};

type ViewMode = "table" | "card";

const BooksPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useBookCategories();
  const { data: locations = [] } = useBookLocations();
  const { data: series = [] } = useBookSeries();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null);
  const [filterSeriesId, setFilterSeriesId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const { data: pageData = EMPTY_PAGE, isLoading } = useBooks({
    search: debouncedSearch,
    categoryId: filterCategoryId,
    locationId: filterLocationId,
    seriesId: filterSeriesId,
    status: filterStatus,
    page,
    size: pageSize,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [categoryPickOpen, setCategoryPickOpen] = useState(false);
  const [preFill, setPreFill] = useState<{
    categoryId: number;
    serialized: boolean;
  } | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [detailBookId, setDetailBookId] = useState<number | null>(null);

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [locationManagerOpen, setLocationManagerOpen] = useState(false);
  const [seriesManagerOpen, setSeriesManagerOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleStatusChange = (value: string | null) => {
    setFilterStatus(value);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
  };

  useEffect(() => {
    if (pageData.totalPages > 0 && page >= pageData.totalPages) {
      setPage(Math.max(0, pageData.totalPages - 1));
    }
  }, [page, pageData.totalPages]);

  return (
    <div className="flex h-full gap-4">
      <aside className="w-48 shrink-0 rounded-lg border bg-card p-3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t("books.categories.title")}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCategoryManagerOpen(true)}
          >
            <PencilIcon className="size-3" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant={filterCategoryId === null ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => {
              setFilterCategoryId(null);
              setPage(0);
            }}
          >
            {t("books.categories.all")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={filterCategoryId === c.id ? "secondary" : "ghost"}
              size="sm"
              className="justify-start truncate"
              onClick={() => {
                setFilterCategoryId(c.id);
                setPage(0);
              }}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t("books.locations.title")}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setLocationManagerOpen(true)}
          >
            <PencilIcon className="size-3" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant={filterLocationId === null ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => {
              setFilterLocationId(null);
              setPage(0);
            }}
          >
            {t("books.locations.all")}
          </Button>
          {locations.map((l) => (
            <Button
              key={l.id}
              variant={filterLocationId === l.id ? "secondary" : "ghost"}
              size="sm"
              className="justify-start truncate"
              onClick={() => {
                setFilterLocationId(l.id);
                setPage(0);
              }}
            >
              {l.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("books.series.title")}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSeriesManagerOpen(true)}
          >
            <PencilIcon className="size-3" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant={filterSeriesId === null ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => {
              setFilterSeriesId(null);
              setPage(0);
            }}
          >
            {t("books.series.all")}
          </Button>
          {series.map((s) => (
            <Button
              key={s.id}
              variant={filterSeriesId === s.id ? "secondary" : "ghost"}
              size="sm"
              className="justify-start truncate"
              onClick={() => {
                setFilterSeriesId(s.id);
                setPage(0);
              }}
            >
              {s.name}
            </Button>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={t("books.searchPlaceholder")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Select value={filterStatus ?? ""} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue>
                {() => {
                  const match = STATUS_OPTIONS.find(
                    (o) => o.value === (filterStatus ?? ""),
                  );
                  return match ? (
                    t(match.label)
                  ) : (
                    <span className="text-muted-foreground">
                      {t("books.status")}
                    </span>
                  );
                }}
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
          <div className="flex rounded-lg ring-1 ring-foreground/10">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("table")}
            >
              <ColumnsIcon className="size-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGridIcon className="size-4" />
            </Button>
          </div>
          <Button onClick={() => setCategoryPickOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("books.addBook")}
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          </div>
        )}

        {!isLoading && pageData.totalElements === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {t("books.noBooks")}
            </span>
          </div>
        )}

        {!isLoading && pageData.totalElements > 0 && viewMode === "table" && (
          <>
            <div className="flex-1 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>{t("books.title_")}</TableHead>
                    <TableHead>{t("books.author")}</TableHead>
                    <TableHead>{t("books.status")}</TableHead>
                    <TableHead>{t("books.category")}</TableHead>
                    <TableHead>{t("books.location")}</TableHead>
                    <TableHead>{t("books.customBarcode")}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.content.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="size-8 overflow-hidden rounded"
                          onClick={() => setDetailBookId(book.id)}
                        >
                          {book.firstPictureUrl ? (
                            <img
                              src={book.firstPictureUrl}
                              alt=""
                              className="size-8 object-cover"
                            />
                          ) : (
                            <div className="flex size-8 items-center justify-center bg-muted text-muted-foreground">
                              <BookIcon className="size-4" />
                            </div>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left text-sm font-medium hover:underline"
                          onClick={() => setDetailBookId(book.id)}
                        >
                          {book.title}
                        </button>
                        {book.serialized && book.childCount > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (+{book.childCount})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-sm">
                        {book.author ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant(book.status)}
                          className="text-xs"
                        >
                          {t(`books.statuses.${book.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {book.categoryName}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="size-3 text-muted-foreground" />
                          {book.locationName}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {book.customBarcode}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setEditingBook(book)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeletingBook(book)}
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
            <Pagination
              currentPage={page}
              totalPages={pageData.totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
            />
          </>
        )}

        {!isLoading && pageData.totalElements > 0 && viewMode === "card" && (
          <>
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pageData.content.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md"
                    onClick={() => setDetailBookId(book.id)}
                  >
                    <div className="aspect-[3/4] bg-muted">
                      {book.firstPictureUrl ? (
                        <img
                          src={book.firstPictureUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <BookIcon className="size-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 p-2">
                      <span className="truncate text-xs font-medium">
                        {book.title}
                      </span>
                      {book.author && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {book.author}
                        </span>
                      )}
                      <div className="mt-1">
                        <Badge
                          variant={statusBadgeVariant(book.status)}
                          className="text-[10px]"
                        >
                          {t(`books.statuses.${book.status}`)}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <Pagination
              currentPage={page}
              totalPages={pageData.totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
            />
          </>
        )}
      </main>

      <Dialog
        open={categoryPickOpen}
        onOpenChange={(v) => !v && setCategoryPickOpen(false)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{t("books.selectCategory")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setPreFill({
                    categoryId: c.id,
                    serialized: c.serialized,
                  });
                  setCategoryPickOpen(false);
                  setCreateOpen(true);
                }}
              >
                <span>{c.name}</span>
                {c.serialized && (
                  <Badge variant="secondary" className="text-xs">
                    {t("books.serialized")}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <CreateBookDialog
        open={createOpen}
        preFill={preFill}
        onClose={() => {
          setCreateOpen(false);
          setPreFill(null);
        }}
        onSuccess={handleRefresh}
      />
      <EditBookDialog
        open={!!editingBook}
        book={
          editingBook
            ? {
                ...editingBook,
                pictures: [],
                children: [],
                series: [],
                invoices: [],
                parentName: null,
              }
            : null
        }
        onClose={() => setEditingBook(null)}
        onSuccess={handleRefresh}
      />
      <DeleteBookDialog
        open={!!deletingBook}
        book={deletingBook}
        onClose={() => setDeletingBook(null)}
        onSuccess={handleRefresh}
      />
      <BookDetailDrawer
        bookId={detailBookId}
        open={detailBookId !== null}
        onClose={() => setDetailBookId(null)}
      />
      <BookCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
      <BookLocationManagerDialog
        open={locationManagerOpen}
        onClose={() => setLocationManagerOpen(false)}
      />
      <BookSeriesManagerDialog
        open={seriesManagerOpen}
        onClose={() => setSeriesManagerOpen(false)}
      />
    </div>
  );
};

export default BooksPage;
