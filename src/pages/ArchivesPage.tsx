import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  TagIcon,
} from "lucide-react";
import type {
  Document,
  DocumentStatus,
  Importance,
  Page,
} from "@/api/documents";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useDocumentCategories } from "@/hooks/queries/useDocumentCategories";
import { useDocuments } from "@/hooks/queries/useDocuments";
import { documentKeys } from "@/hooks/queries/documentKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import DocumentDialog from "@/components/archives/DocumentDialog";
import DeleteDocumentDialog from "@/components/archives/DeleteDocumentDialog";
import DocumentDetailDrawer from "@/components/archives/DocumentDetailDrawer";
import DocumentCategoryManagerDialog from "@/components/archives/DocumentCategoryManagerDialog";
import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";

const STATUS_OPTIONS: DocumentStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
  "LOST",
];

const IMPORTANCE_OPTIONS: Importance[] = ["HIGH", "MEDIUM", "LOW"];

const EMPTY_PAGE: Page<Document> = {
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
  status: DocumentStatus,
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
  }
};

const importanceBadgeVariant = (
  importance: Importance,
): "destructive" | "warning" | "secondary" => {
  switch (importance) {
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "secondary";
  }
};

const ArchivesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useDocumentCategories();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | null>(
    null,
  );
  const [filterImportance, setFilterImportance] =
    useState<Importance | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { data: pageData, isLoading } = useDocuments({
    search: debouncedSearch,
    categoryId: filterCategoryId,
    status: filterStatus,
    importance: filterImportance,
    parentId: null,
    page,
    size: pageSize,
  });

  const data = pageData ?? EMPTY_PAGE;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [drawerDocId, setDrawerDocId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const docIdParam = searchParams.get("documentId");
    if (docIdParam) {
      const id = Number(docIdParam);
      if (!Number.isNaN(id)) {
        setDrawerDocId(id);
        setDrawerOpen(true);
        const next = new URLSearchParams(searchParams);
        next.delete("documentId");
        const query = next.toString();
        navigate(query ? `/archives?${query}` : "/archives", {
          replace: true,
        });
      }
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleOpenDrawer = (docId: number) => {
    setDrawerDocId(docId);
    setDrawerOpen(true);
  };

  const handleNavigateToDocument = (docId: number) => {
    setDrawerDocId(docId);
  };

  const totalPages = data.totalPages;
  const currentPage = data.number;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("archives.searchPlaceholder")}
            className="pl-8"
          />
        </div>

        <div className="w-40">
          <Select
            value={filterCategoryId}
            onValueChange={(v) => {
              setFilterCategoryId(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("archives.filters.allCategories")}
              >
                {() =>
                  filterCategoryId == null
                    ? t("archives.filters.allCategories")
                    : (categories.find((c) => c.id === filterCategoryId)
                        ?.name ??
                      t("archives.filters.allCategories"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("archives.filters.allCategories")}
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("archives.filters.allStatuses")}
              >
                {() =>
                  filterStatus == null
                    ? t("archives.filters.allStatuses")
                    : t(`archives.status.${filterStatus.toLowerCase()}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("archives.filters.allStatuses")}
              </SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`archives.status.${s.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filterImportance}
            onValueChange={(v) => {
              setFilterImportance(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("archives.filters.allImportance")}
              >
                {() =>
                  filterImportance == null
                    ? t("archives.filters.allImportance")
                    : t(
                        `archives.importance.${filterImportance.toLowerCase()}`,
                      )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("archives.filters.allImportance")}
              </SelectItem>
              {IMPORTANCE_OPTIONS.map((i) => (
                <SelectItem key={i} value={i}>
                  {t(`archives.importance.${i.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="ml-auto flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryManagerOpen(true)}
          >
            <TagIcon className="size-3.5" />
            {t("archives.categories.manage")}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            {t("archives.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("archives.table.name")}</TableHead>
              <TableHead>{t("archives.table.category")}</TableHead>
              <TableHead>{t("archives.table.holder")}</TableHead>
              <TableHead>{t("archives.table.documentNumber")}</TableHead>
              <TableHead>{t("archives.table.expiryDate")}</TableHead>
              <TableHead>{t("archives.table.status")}</TableHead>
              <TableHead className="text-right">
                {t("archives.table.subDocuments")}
              </TableHead>
              <TableHead className="text-right">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("archives.noData")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data.content.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenDrawer(doc.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={importanceBadgeVariant(doc.importance)}
                        className="size-1.5 shrink-0 rounded-full p-0"
                      />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.categoryName}</TableCell>
                  <TableCell>{doc.holder ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {doc.documentNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {doc.expiryDate ? formatDate(doc.expiryDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(doc.status)}>
                      {t(`archives.status.${doc.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {doc.subDocumentCount > 0
                      ? doc.subDocumentCount
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDoc(doc);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDoc(doc);
                        }}
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
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
      />

      <DocumentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <DocumentDialog
        open={!!editingDoc}
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: documentKeys.lists(),
          })
        }
      />
      <DeleteDocumentDialog
        open={!!deletingDoc}
        document={deletingDoc}
        onClose={() => setDeletingDoc(null)}
      />
      <DocumentDetailDrawer
        documentId={drawerDocId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerDocId(null);
        }}
        onNavigateToDocument={handleNavigateToDocument}
      />
      <DocumentCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </div>
  );
};

export default ArchivesPage;
