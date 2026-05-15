import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
} from "lucide-react";
import type { Invoice, InvoiceType, InvoiceStatus, InvoiceDetail, Page } from "@/api/invoices";
import { getInvoices, getInvoiceById } from "@/api/invoices";
import { INVOICE_TYPES } from "@/components/invoices/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import AuthImg from "@/components/AuthImg";
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
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import EditInvoiceDialog from "@/components/invoices/EditInvoiceDialog";
import DeleteInvoiceDialog from "@/components/invoices/DeleteInvoiceDialog";
import InvoiceDetailDrawer from "@/components/invoices/InvoiceDetailDrawer";

import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";

const INVOICE_STATUSES: InvoiceStatus[] = ["NORMAL", "VOIDED", "RED_FLUSHED"];

const statusBadgeVariant = (
  status: InvoiceStatus,
): "success" | "destructive" | "secondary" => {
  switch (status) {
    case "NORMAL":
      return "success";
    case "VOIDED":
      return "destructive";
    case "RED_FLUSHED":
      return "secondary";
  }
};

const InvoicesPage = () => {
  const { t } = useTranslation();

  const [pageData, setPageData] = useState<Page<Invoice>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: PAGE_SIZE_OPTIONS[0],
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState<InvoiceType | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceDetail | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getInvoices({
        search: debouncedSearch || undefined,
        invoiceType: filterType ?? undefined,
        invoiceStatus: filterStatus ?? undefined,
        page,
        size: pageSize,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setPageData(data);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterType, filterStatus, page, pageSize]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleRowClick = (invoice: Invoice) => {
    setDetailInvoiceId(invoice.id);
  };

  const handleEditFromDrawer = (invoice: InvoiceDetail) => {
    setDetailInvoiceId(null);
    setEditingInvoice(invoice);
  };

  const handleEditFromTable = async (id: number) => {
    try {
      const { data } = await getInvoiceById(id);
      setEditingInvoice(data);
    } catch {
      // fallback: open with list data won't happen since we don't set state
    }
  };

  const handleDeleteFromDrawer = (invoice: InvoiceDetail) => {
    setDetailInvoiceId(null);
    setDeletingInvoice(invoice);
  };

  const totalPages = pageData.totalPages;
  const currentPage = pageData.number;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("invoices.search")}
            className="pl-8"
          />
        </div>

        <div className="w-44">
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("invoices.filters.allTypes")}>
                {() =>
                  filterType == null
                    ? t("invoices.filters.allTypes")
                    : t(`invoices.type.${filterType}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>{t("invoices.filters.allTypes")}</SelectItem>
              {INVOICE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`invoices.type.${type}`)}
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
              <SelectValue placeholder={t("invoices.filters.allStatuses")}>
                {() =>
                  filterStatus == null
                    ? t("invoices.filters.allStatuses")
                    : t(`invoices.status.${filterStatus}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("invoices.filters.allStatuses")}
              </SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`invoices.status.${status}`)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="ml-auto flex gap-1">
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            {t("invoices.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoices.columns.invoiceNumber")}</TableHead>
              <TableHead>{t("invoices.columns.invoiceDate")}</TableHead>
              <TableHead>{t("invoices.columns.invoiceType")}</TableHead>
              <TableHead>{t("invoices.columns.buyerName")}</TableHead>
              <TableHead>{t("invoices.columns.sellerName")}</TableHead>
              <TableHead>{t("invoices.columns.boundAssets")}</TableHead>
              <TableHead className="text-right">{t("invoices.columns.totalAmount")}</TableHead>
              <TableHead>{t("invoices.columns.invoiceStatus")}</TableHead>
              <TableHead className="text-right">{t("invoices.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && pageData.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              pageData.content.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(invoice)}
                >
                  <TableCell className="font-mono text-xs max-w-[120px] truncate">
                    {invoice.invoiceNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`invoices.type.${invoice.invoiceType}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.buyerName ?? "—"}</TableCell>
                  <TableCell>{invoice.sellerName ?? "—"}</TableCell>
                  <TableCell>
                    {invoice.assets.length === 0 ? (
                      "—"
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {invoice.assets[0].firstPictureUrl && (
                          <AuthImg
                            url={invoice.assets[0].firstPictureUrl}
                            className="size-5 shrink-0 rounded object-cover"
                          />
                        )}
                        <span className="text-xs truncate">
                          {invoice.assets[0].name}
                        </span>
                        {invoice.assets.length > 1 && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            +{invoice.assets.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {invoice.totalAmount != null
                      ? `¥${invoice.totalAmount.toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(invoice.invoiceStatus)}>
                      {t(`invoices.status.${invoice.invoiceStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleEditFromTable(invoice.id)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeletingInvoice(invoice)}
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

      <CreateInvoiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchInvoices}
      />
      <EditInvoiceDialog
        open={!!editingInvoice}
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSuccess={fetchInvoices}
      />
      <DeleteInvoiceDialog
        open={!!deletingInvoice}
        invoice={deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        onSuccess={fetchInvoices}
      />
      <InvoiceDetailDrawer
        invoiceId={detailInvoiceId}
        open={detailInvoiceId !== null}
        onClose={() => setDetailInvoiceId(null)}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
        onRefresh={fetchInvoices}
      />
    </div>
  );
};

export default InvoicesPage;
