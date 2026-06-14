import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import type {
  Document,
  DocumentStatus,
  Importance,
} from "@/api/documents";
import { formatDate } from "@/lib/utils";
import { useDocumentDetail } from "@/hooks/queries/useDocumentDetail";
import { useInvalidateDocuments } from "@/hooks/queries/useInvalidateDocuments";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import AttachmentManager from "@/components/shared/AttachmentManager";
import InvoiceBindingManager from "@/components/shared/InvoiceBindingManager";
import type { FileRecord } from "@/api/files";
import {
  uploadDocumentAttachment,
  deleteDocumentAttachment,
} from "@/api/documentAttachments";
import { bindDocumentInvoice, unbindDocumentInvoice } from "@/api/documents";
import DocumentDialog from "./DocumentDialog";
import DeleteDocumentDialog from "./DeleteDocumentDialog";

const statusVariant = (
  status: DocumentStatus | undefined | null,
): "success" | "destructive" | "secondary" | "warning" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
      return "destructive";
    case "REVOKED":
      return "secondary";
    case "LOST":
      return "warning";
    default:
      return "secondary";
  }
};

const importanceVariant = (
  importance: Importance | undefined | null,
): "destructive" | "warning" | "secondary" => {
  switch (importance) {
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "secondary";
    default:
      return "secondary";
  }
};

interface DocumentDetailDrawerProps {
  readonly documentId: number | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onNavigateToDocument?: (id: number) => void;
}

const DocumentDetailDrawer = ({
  documentId,
  open,
  onClose,
  onNavigateToDocument,
}: DocumentDetailDrawerProps) => {
  const { t } = useTranslation();
  const invalidate = useInvalidateDocuments();
  const { data: doc, isLoading, error } = useDocumentDetail(documentId);
  const [showNumber, setShowNumber] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subDocToDelete, setSubDocToDelete] = useState<Document | null>(
    null,
  );
  const [createSubOpen, setCreateSubOpen] = useState(false);

  const maskNumber = (num: string) => {
    if (num.length >= 6) return `${num.slice(0, 3)}***${num.slice(-3)}`;
    if (num.length >= 2) return `${num.slice(0, 1)}***${num.slice(-1)}`;
    return "***";
  };

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {isLoading && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-destructive">
                {t("archives.errors.loadFailed")}
              </p>
            </div>
          )}
          {doc && (
            <div className="grid gap-6">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  {doc.parentId && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onNavigateToDocument?.(doc.parentId!)}
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                  )}
                  <SheetTitle className="flex items-center gap-2 truncate">
                    {doc.name}
                    <Badge variant={importanceVariant(doc.importance)}>
                      {t(
                        `archives.importance.${(doc.importance ?? "medium").toLowerCase()}`,
                      )}
                    </Badge>
                    <Badge variant={statusVariant(doc.status)}>
                      {t(
                        `archives.status.${(doc.status ?? "active").toLowerCase()}`,
                      )}
                    </Badge>
                  </SheetTitle>
                </div>
                <SheetDescription>
                  {doc.categoryName}
                </SheetDescription>
              </SheetHeader>

              {doc.parentId && doc.parentName && (
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors w-full"
                  onClick={() => onNavigateToDocument?.(doc.parentId!)}
                >
                  <ArrowUpIcon className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">
                      {t("archives.detail.parentDocument")}
                    </span>
                    <span className="block text-sm font-medium truncate">
                      {doc.parentName}
                    </span>
                  </div>
                </button>
              )}

              <div className="grid gap-3 rounded-lg border p-4 text-sm">
                {doc.holder && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.holder")}
                    </span>
                    <span>{doc.holder}</span>
                  </div>
                )}
                {doc.documentNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.documentNumber")}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      {showNumber
                        ? doc.documentNumber
                        : maskNumber(doc.documentNumber)}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowNumber(!showNumber)}
                      >
                        {showNumber ? (
                          <EyeOffIcon className="size-3" />
                        ) : (
                          <EyeIcon className="size-3" />
                        )}
                      </Button>
                    </span>
                  </div>
                )}
                {doc.issuer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.issuer")}
                    </span>
                    <span>{doc.issuer}</span>
                  </div>
                )}
                {doc.issueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.issueDate")}
                    </span>
                    <span>{formatDate(doc.issueDate)}</span>
                  </div>
                )}
                {doc.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.expiryDate")}
                    </span>
                    <span>{formatDate(doc.expiryDate)}</span>
                  </div>
                )}
                {doc.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.reminderDays")}
                    </span>
                    <span>
                      {t("archives.detail.reminderDaysValue", {
                        days: doc.reminderDays,
                      })}
                    </span>
                  </div>
                )}
                {doc.note && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("archives.form.note")}
                    </span>
                    <span className="max-w-[60%] text-right whitespace-pre-line">
                      {doc.note}
                    </span>
                  </div>
                )}
              </div>

              {doc.parentId == null && (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {t("archives.detail.subDocuments")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateSubOpen(true)}
                    >
                      <PlusIcon className="size-3.5" />
                      {t("archives.detail.addSubDocument")}
                    </Button>
                  </div>
                  {(doc.subDocuments ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("archives.detail.noSubDocuments")}
                    </p>
                  ) : (
                    <div className="rounded-lg ring-1 ring-foreground/10">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {t("archives.table.name")}
                            </TableHead>
                            <TableHead>
                              {t("archives.table.category")}
                            </TableHead>
                            <TableHead>
                              {t("archives.table.expiryDate")}
                            </TableHead>
                            <TableHead>
                              {t("archives.table.status")}
                            </TableHead>
                            <TableHead className="text-right">
                              {t("common.actions")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(doc.subDocuments ?? []).map((sub) => (
                            <TableRow
                              key={sub.id}
                              className="cursor-pointer"
                              onClick={() =>
                                onNavigateToDocument?.(sub.id)
                              }
                            >
                              <TableCell className="font-medium">
                                {sub.name}
                              </TableCell>
                              <TableCell>{sub.categoryName}</TableCell>
                              <TableCell className="text-xs">
                                {sub.expiryDate
                                  ? formatDate(sub.expiryDate)
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={statusVariant(sub.status)}
                                >
                                  {t(
                                    `archives.status.${(sub.status ?? "active").toLowerCase()}`,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSubDocToDelete(sub);
                                  }}
                                >
                                  <TrashIcon className="size-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3">
                <AttachmentManager
                  attachments={(doc.attachments ?? []).map((a) => ({
                    id: a.id,
                    fileId: a.fileId,
                    filename: a.filename,
                    fileSize: a.fileSize,
                    url: a.url,
                    indexed: a.indexed,
                  }))}
                  onSelect={async (file: FileRecord) => {
                    await uploadDocumentAttachment(doc.id, undefined, file.id);
                    void invalidate.invalidateDetail(doc.id);
                  }}
                  onDelete={async (id: number) => {
                    await deleteDocumentAttachment(doc.id, id);
                    void invalidate.invalidateDetail(doc.id);
                  }}
                />
              </div>

              <div className="grid gap-3">
                <InvoiceBindingManager
                  invoices={(doc.invoices ?? []).map((inv) => ({
                    id: inv.id,
                    invoiceId: inv.invoiceId,
                    invoiceNumber: inv.invoiceNumber,
                    invoiceDate: inv.invoiceDate,
                    totalAmount: inv.totalAmount,
                    sellerName: inv.sellerName,
                  }))}
                  title={t("archives.detail.invoices")}
                  emptyLabel={t("archives.detail.noInvoices")}
                  bindLabel={t("common.bindInvoice")}
                  uploadNewLabel={t("common.uploadNew")}
                  onBindInvoice={async (invoiceId: number) => {
                    await bindDocumentInvoice(doc.id, invoiceId);
                    void invalidate.invalidateDetail(doc.id);
                  }}
                  onUnbind={async (id: number) => {
                    await unbindDocumentInvoice(doc.id, id);
                    void invalidate.invalidateDetail(doc.id);
                  }}
                  onCreateInvoice={async () => {
                    void invalidate.invalidateDetail(doc.id);
                  }}
                  onInvoiceChanged={() =>
                    void invalidate.invalidateDetail(doc.id)
                  }
                />
              </div>

              <SheetFooter className="shrink-0">
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <PencilIcon className="size-3.5" />
                  {t("archives.edit")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <TrashIcon className="size-3.5" />
                  {t("archives.delete")}
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {doc && (
        <>
          <DocumentDialog
            open={editOpen}
            document={doc}
            onClose={() => setEditOpen(false)}
            onSuccess={() => void invalidate.invalidateDetail(doc.id)}
          />
          <DeleteDocumentDialog
            open={deleteOpen}
            document={doc}
            onClose={() => setDeleteOpen(false)}
            onSuccess={onClose}
          />
          <DocumentDialog
            open={createSubOpen}
            parentId={doc.id}
            onClose={() => setCreateSubOpen(false)}
            onSuccess={() => void invalidate.invalidateDetail(doc.id)}
          />
        </>
      )}

      <DeleteDocumentDialog
        open={!!subDocToDelete}
        document={subDocToDelete}
        onClose={() => setSubDocToDelete(null)}
        onSuccess={() => {
          if (doc) void invalidate.invalidateDetail(doc.id);
        }}
      />
    </>
  );
};

export default DocumentDetailDrawer;
