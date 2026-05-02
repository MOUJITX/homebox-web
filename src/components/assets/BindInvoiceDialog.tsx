import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon, LinkIcon } from "lucide-react";
import type { Invoice } from "@/api/invoices";
import { getInvoices } from "@/api/invoices";
import { bindInvoiceToAsset } from "@/api/assetInvoices";
import { getErrorMessage } from "@/lib/error";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";

interface BindInvoiceDialogProps {
  readonly assetId: number;
  readonly boundInvoiceIds: number[];
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const statusBadgeVariant = (status: string): "success" | "destructive" | "secondary" => {
  switch (status) {
    case "NORMAL": return "success";
    case "VOIDED": return "destructive";
    case "RED_FLUSHED": return "secondary";
    default: return "secondary";
  }
};

const BindInvoiceDialog = ({ assetId, boundInvoiceIds, open, onClose, onSuccess }: BindInvoiceDialogProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
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
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (open) {
      void fetchInvoices();
    }
  }, [open, fetchInvoices]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const resetAndClose = () => {
    setSearch("");
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
      await bindInvoiceToAsset(assetId, selectedId);
      resetAndClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.invoices.errors.bindFailed"));
    } finally {
      setBinding(false);
    }
  };

  const availableInvoices = invoices.filter((inv) => !boundInvoiceIds.includes(inv.id));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("assets.invoices.bindDialog.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <SearchIcon className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder={t("assets.invoices.bindDialog.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-8">{t("common.loading")}</p>
          )}

          {!loading && availableInvoices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("common.noResults")}
            </p>
          )}

          {!loading && availableInvoices.length > 0 && (
            <div className="space-y-1">
              {availableInvoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                    selectedId === inv.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedId(inv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs truncate">
                        {inv.invoiceNumber || `#${inv.id}`}
                      </span>
                      {inv.invoiceDate && (
                        <span className="text-muted-foreground text-xs">
                          {formatDate(inv.invoiceDate)}
                        </span>
                      )}
                      <Badge variant={statusBadgeVariant(inv.invoiceStatus)} className="text-xs">
                        {t(`invoices.status.${inv.invoiceStatus}`)}
                      </Badge>
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
            <span>{t("common.pageInfo", { current: page + 1, total: totalPages })}</span>
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

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleBind} disabled={!selectedId || binding}>
            <LinkIcon className="size-3.5" />
            {binding ? t("common.saving") : t("assets.invoices.bindDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BindInvoiceDialog;
