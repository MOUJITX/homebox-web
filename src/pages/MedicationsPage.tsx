import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { getMedications, type MedicationReminder } from "@/api/medications";
import { type Page } from "@/api/goods";
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
import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";
import CreateMedicationDialog from "@/components/medications/CreateMedicationDialog";
import EditMedicationDialog from "@/components/medications/EditMedicationDialog";
import DeleteMedicationDialog from "@/components/medications/DeleteMedicationDialog";

type FilterMode = "all" | "enabled" | "disabled";

const MedicationsPage = () => {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<Page<MedicationReminder>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: PAGE_SIZE_OPTIONS[0],
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MedicationReminder | null>(null);
  const [deleting, setDeleting] = useState<MedicationReminder | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const enabledParam = filter === "all" ? undefined : filter === "enabled";
      const { data } = await getMedications(page, pageSize, enabledParam);
      setPageData(data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    void fetchData();
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const handleFilterChange = (mode: FilterMode) => {
    setFilter(mode);
    setPage(0);
  };

  const formatHours = (hours: string) =>
    hours
      .split(",")
      .map((h) => `${h}:00`)
      .join(", ");

  const statusBadge = (enabled: boolean) =>
    enabled
      ? { variant: "success" as const, label: t("medications.status.enabled") }
      : {
          variant: "secondary" as const,
          label: t("medications.status.disabled"),
        };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border rounded-md">
          {(
            [
              ["all", t("medications.filterAll")],
              ["enabled", t("medications.filterEnabled")],
              ["disabled", t("medications.filterDisabled")],
            ] as [FilterMode, string][]
          ).map(([mode, label], i, arr) => (
            <button
              key={mode}
              onClick={() => handleFilterChange(mode)}
              className={`px-3 py-1 text-sm transition-colors ${
                i === 0 ? "rounded-l-md" : ""
              } ${i === arr.length - 1 ? "rounded-r-md" : ""} ${
                filter === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            {t("medications.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("medications.columns.medicine")}</TableHead>
              <TableHead>{t("medications.columns.dosage")}</TableHead>
              <TableHead>{t("medications.columns.frequency")}</TableHead>
              <TableHead>{t("medications.columns.course")}</TableHead>
              <TableHead>{t("medications.columns.status")}</TableHead>
              <TableHead className="w-20">
                {t("medications.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && pageData.empty && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("medications.empty")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              pageData.content.map((r) => {
                const status = statusBadge(r.enabled);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {r.brandName}-{r.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.categoryName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.dosageMethod && (
                        <span>
                          {r.dosageMethod}
                          {r.dosageQuantity && ` ${r.dosageQuantity}`}
                          {r.dosageUnit && ` ${r.dosageUnit}`}
                        </span>
                      )}
                      {r.dosageNote && (
                        <span className="block text-xs text-muted-foreground">
                          {r.dosageNote}
                        </span>
                      )}
                      {!r.dosageMethod && !r.dosageNote && "-"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatHours(r.frequencyHours)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">
                        {r.courseStartDate} ~ {r.courseEndDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditing(r)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleting(r)}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={pageData.totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      <CreateMedicationDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleRefresh}
      />
      <EditMedicationDialog
        open={!!editing}
        reminder={editing}
        onClose={() => setEditing(null)}
        onSuccess={handleRefresh}
      />
      <DeleteMedicationDialog
        open={!!deleting}
        reminder={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default MedicationsPage;
