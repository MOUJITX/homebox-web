import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import type { Book } from "@/api/books";
import { updateBook } from "@/api/books";
import { uploadBookPicture, deleteBookPicture } from "@/api/bookPictures";
import { bindInvoiceToBook, unbindInvoiceFromBook } from "@/api/bookInvoices";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useBookDetail } from "@/hooks/queries/useBookDetail";
import { useBookInvoices } from "@/hooks/queries/useBookInvoices";
import { useInvalidateBooks } from "@/hooks/queries/useInvalidateBooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import PictureManager from "@/components/shared/PictureManager";
import InvoiceBindingManager, {
  type BoundInvoice,
} from "@/components/shared/InvoiceBindingManager";
import CreateBookDialog from "./CreateBookDialog";
import EditBookDialog from "./EditBookDialog";
import DeleteBookDialog from "./DeleteBookDialog";

const Field = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="grid gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  READING: "success",
  WANT_TO_READ: "warning",
  READ: "secondary",
};

interface BookDetailDrawerProps {
  readonly bookId: number | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

const BookDetailDrawer = ({ bookId, open, onClose }: BookDetailDrawerProps) => {
  const { t } = useTranslation();
  const {
    data: detail,
    isLoading,
    error,
  } = useBookDetail(open ? bookId : null);
  const invalidate = useInvalidateBooks();
  const { data: bookInvoices = [] } = useBookInvoices(open ? bookId : null);

  const [createChildOpen, setCreateChildOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingChild, setEditingChild] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [deletingChild, setDeletingChild] = useState<Book | null>(null);

  const handleToggleStatus = async (child: Book) => {
    const statuses = ["WANT_TO_READ", "READING", "READ"] as const;
    const nextIdx =
      (statuses.indexOf(child.status as (typeof statuses)[number]) + 1) %
      statuses.length;
    await updateBook(child.id, { status: statuses[nextIdx] });
    void invalidate.invalidateDetail(bookId!);
    void invalidate.invalidateList();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="truncate">
              {detail?.title ?? t("books.bookDetail")}
            </SheetTitle>
          </SheetHeader>

          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-sm text-muted-foreground">
                {t("common.loading")}
              </span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-sm text-destructive">
                {t("books.errors.loadFailed")}
              </span>
            </div>
          )}

          {!isLoading && detail && (
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label={t("books.customBarcode")}
                  value={detail.customBarcode}
                />
                <Field label={t("books.isbn")} value={detail.isbn} />
                <Field label={t("books.author")} value={detail.author} />
                <Field label={t("books.publisher")} value={detail.publisher} />
                <Field
                  label={t("books.publishDate")}
                  value={
                    detail.publishDate ? formatDate(detail.publishDate) : null
                  }
                />
                <Field
                  label={t("books.category")}
                  value={detail.categoryName}
                />
                <Field
                  label={t("books.location")}
                  value={detail.locationName}
                />
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("books.status")}
                  </span>
                  <Badge
                    variant={STATUS_VARIANT[detail.status] ?? "secondary"}
                    className="w-fit"
                  >
                    {t(`books.statuses.${detail.status}`)}
                  </Badge>
                </div>
                <Field
                  label={t("books.purchaseDate")}
                  value={
                    detail.purchaseDate ? formatDate(detail.purchaseDate) : null
                  }
                />
                <Field
                  label={t("books.purchasePrice")}
                  value={
                    detail.purchasePrice
                      ? formatCurrency(detail.purchasePrice)
                      : null
                  }
                />
                {detail.parentName && (
                  <Field
                    label={t("books.parentBook")}
                    value={detail.parentName}
                  />
                )}
                {detail.issueNumber && (
                  <Field
                    label={t("books.issueNumber")}
                    value={detail.issueNumber}
                  />
                )}
              </div>

              {detail.description && (
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("books.description")}
                  </span>
                  <p className="text-sm whitespace-pre-wrap">
                    {detail.description}
                  </p>
                </div>
              )}

              {detail.note && (
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("books.note")}
                  </span>
                  <p className="text-sm whitespace-pre-wrap">{detail.note}</p>
                </div>
              )}

              {detail.series && detail.series.length > 0 && (
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("books.series.belongTo")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {detail.series.map((s) => (
                      <Badge key={s.id} variant="outline" className="text-xs">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <PictureManager
                pictures={detail.pictures}
                onSync={async (fileIds) => {
                  const pictures = detail.pictures ?? [];
                  const currentIds = new Set(pictures.map((p) => p.fileId));
                  const desiredIds = new Set(fileIds);
                  await Promise.all([
                    ...fileIds
                      .filter((id) => !currentIds.has(id))
                      .map((id) => uploadBookPicture(bookId!, undefined, id)),
                    ...pictures
                      .filter((p) => !desiredIds.has(p.fileId))
                      .map((p) => deleteBookPicture(bookId!, p.id)),
                  ]);
                  void invalidate.invalidateDetail(bookId!);
                }}
              />

              <InvoiceBindingManager
                invoices={bookInvoices.map(
                  (inv) =>
                    ({
                      id: inv.id,
                      invoiceId: inv.invoiceId,
                      invoiceNumber: inv.invoiceNumber,
                      invoiceDate: inv.invoiceDate,
                      totalAmount: inv.totalAmount,
                      sellerName: inv.sellerName,
                    }) satisfies BoundInvoice,
                )}
                title={t("common.invoices")}
                emptyLabel={t("common.noInvoices")}
                bindLabel={t("common.bind")}
                onBindInvoice={async (invoiceId) => {
                  await bindInvoiceToBook(bookId!, invoiceId);
                  void invalidate.invalidateInvoices(bookId!);
                }}
                boundInvoiceIds={bookInvoices.map((i) => i.invoiceId)}
                uploadNewLabel={t("common.uploadNew")}
                onCreateInvoice={async (invoice) => {
                  await bindInvoiceToBook(bookId!, invoice.id);
                  void invalidate.invalidateInvoices(bookId!);
                }}
                onUnbind={async (id) => {
                  await unbindInvoiceFromBook(bookId!, id);
                  void invalidate.invalidateInvoices(bookId!);
                }}
                onInvoiceChanged={() =>
                  void invalidate.invalidateDetail(bookId!)
                }
              />

              {detail.serialized && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t("books.childrenBooks")} ({detail.children?.length ?? 0}
                      )
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateChildOpen(true)}
                    >
                      <PlusIcon className="size-3.5" />
                      {t("books.addChildBook")}
                    </Button>
                  </div>
                  {(!detail.children || detail.children.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      {t("books.noChildrenBooks")}
                    </p>
                  )}
                  {detail.children?.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {child.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {child.customBarcode}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={STATUS_VARIANT[child.status] ?? "secondary"}
                          className="cursor-pointer text-xs"
                          onClick={() => void handleToggleStatus(child)}
                        >
                          {t(`books.statuses.${child.status}`)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditingChild(child)}
                        >
                          <PencilIcon className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeletingChild(child)}
                        >
                          <TrashIcon className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && detail && (
            <SheetFooter className="shrink-0 flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <PencilIcon className="size-3.5" />
                {t("common.edit")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeletingBook(detail)}
              >
                <TrashIcon className="size-3.5" />
                {t("common.delete")}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {detail && (
        <>
          <CreateBookDialog
            open={createChildOpen}
            parentId={detail.id}
            parentBarcode={detail.customBarcode}
            parentFields={{
              categoryId: detail.categoryId,
              locationId: detail.locationId,
            }}
            onClose={() => setCreateChildOpen(false)}
            onSuccess={() => void invalidate.invalidateDetail(bookId!)}
          />
          <EditBookDialog
            open={editing}
            book={detail ?? null}
            onClose={() => setEditing(false)}
            onSuccess={() => {
              if (bookId) void invalidate.invalidateDetail(bookId);
            }}
          />
          <DeleteBookDialog
            open={!!deletingBook}
            book={deletingBook}
            onClose={() => setDeletingBook(null)}
            onSuccess={() => {
              setEditing(false);
              onClose();
            }}
          />
          <EditBookDialog
            open={editingChild !== null}
            book={
              editingChild
                ? {
                    ...editingChild,
                    parentName: null,
                    pictures: [],
                    children: [],
                    series: [],
                    invoices: [],
                  }
                : null
            }
            onClose={() => setEditingChild(null)}
            onSuccess={() => {
              setEditingChild(null);
              if (bookId) void invalidate.invalidateDetail(bookId);
            }}
          />
          <DeleteBookDialog
            open={!!deletingChild}
            book={deletingChild}
            onClose={() => setDeletingChild(null)}
            onSuccess={() => {
              setDeletingChild(null);
              if (bookId) void invalidate.invalidateDetail(bookId);
            }}
          />
        </>
      )}
    </>
  );
};

export default BookDetailDrawer;
