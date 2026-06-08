import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon, LinkIcon } from "lucide-react";
import type { Invoice, InvoiceType, InvoiceStatus } from "@/api/invoices";
import { getInvoices } from "@/api/invoices";
import {
  INVOICE_TYPES,
  INVOICE_STATUSES,
} from "@/components/invoices/constants";
import { getErrorMessage } from "@/lib/error";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onBind: (invoiceId: number) => Promise<void>;
  readonly onCreateNew: () => void;
}

const BindVisitInvoiceDialog = ({
  open,
  onClose,
  onBind,
  onCreateNew,
}: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState<InvoiceType | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [binding, setBinding] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getInvoices({
        search: debouncedSearch || undefined,
        invoiceType: filterType ?? undefined,
        invoiceStatus: filterStatus ?? undefined,
        page,
        size: 10,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setInvoices(data.content);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterType, filterStatus, page]);

  useEffect(() => {
    if (open) void fetchInvoices();
  }, [open, fetchInvoices]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filterType, filterStatus]);

  const resetAndClose = () => {
    setSearch("");
    setFilterType(null);
    setFilterStatus(null);
    setSelectedId(null);
    setError("");
    setPage(0);
    onClose();
  };

  const handleBind = async () => {
    if (!selectedId) return;
    setBinding(true);
    setError("");
    try {
      await onBind(selectedId);
      resetAndClose();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setBinding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t("medical.invoicesSection.bindDialog.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <SearchIcon className="size-4 text-muted-foreground shrink-0" />
            <Input
              placeholder={t("medical.invoicesSection.bindDialog.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v)}
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
                  <SelectItem value={null}>
                    {t("invoices.filters.allTypes")}
                  </SelectItem>
                  {INVOICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`invoices.type.${type}`)}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v)}
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("common.loading")}
            </p>
          )}
          {!loading && invoices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("common.noResults")}
            </p>
          )}
          {!loading && invoices.length > 0 && (
            <div className="space-y-1">
              {invoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${selectedId === inv.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"}`}
                  onClick={() => setSelectedId(inv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {inv.invoiceDate && (
                        <span className="text-muted-foreground text-xs">
                          {formatDate(inv.invoiceDate)}
                        </span>
                      )}
                      <span className="text-xs truncate">
                        {inv.sellerName ??
                          t(`invoices.type.${inv.invoiceType}`)}
                      </span>
                    </div>
                    {inv.totalAmount != null && (
                      <span className="text-xs font-medium shrink-0">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("common.previous")}
            </Button>
            <span>
              {t("common.pageInfo", { current: page + 1, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetAndClose();
              onCreateNew();
            }}
          >
            {t("medical.invoicesSection.uploadNew")}
          </Button>
          <Button onClick={handleBind} disabled={!selectedId || binding}>
            <LinkIcon className="size-3.5" />
            {binding
              ? t("common.saving")
              : t("medical.invoicesSection.bindDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BindVisitInvoiceDialog;
