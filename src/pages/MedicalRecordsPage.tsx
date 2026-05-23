import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "lucide-react";
import {
  getVisitRecords,
  getPatientNames,
  deleteVisitRecord,
  type VisitRecord,
  type VisitType,
  type Page,
} from "@/api/medical";
import { getInstitutions, type MedicalInstitution } from "@/api/institutions";
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
import { Select, SelectTrigger, SelectPopup, SelectItem, SelectValue } from "@/components/ui/select";
import CreateVisitDialog from "@/components/medical/CreateVisitDialog";
import VisitDetailDrawer from "@/components/medical/VisitDetailDrawer";
import DeleteVisitDialog from "@/components/medical/DeleteVisitDialog";
import InstitutionManagerDialog from "@/components/medical/InstitutionManagerDialog";
import { BuildingIcon } from "lucide-react";

const MedicalRecordsPage = () => {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<Page<VisitRecord>>({
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
  const [loading, setLoading] = useState(true);
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitType | "">("");
  const [institutionFilter, setInstitutionFilter] = useState<number | null>(null);
  const [patientNameFilter, setPatientNameFilter] = useState("");
  const [institutions, setInstitutions] = useState<MedicalInstitution[]>([]);
  const [patientNames, setPatientNames] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<VisitRecord | null>(null);
  const [deleting, setDeleting] = useState<VisitRecord | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [institutionManagerOpen, setInstitutionManagerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: pageSize };
      if (visitTypeFilter) params.visitType = visitTypeFilter;
      if (institutionFilter) params.institutionId = institutionFilter;
      if (patientNameFilter) params.patientName = patientNameFilter;
      const { data } = await getVisitRecords(params);
      setPageData(data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, visitTypeFilter, institutionFilter, patientNameFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    getInstitutions().then(({ data }) => setInstitutions(data)).catch(() => {});
    getPatientNames().then(({ data }) => setPatientNames(data)).catch(() => {});
  }, []);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const formatTimeCell = (r: VisitRecord) => {
    if (r.visitType === "OUTPATIENT") {
      return <span className="text-sm">{r.visitDate}</span>;
    }
    if (r.dischargeDate) {
      return <span className="text-sm">{r.visitDate} ~ {r.dischargeDate}</span>;
    }
    return <span className="text-sm">{r.visitDate} ~ {t("medical.inHospital")}</span>;
  };

  const formatDeptCell = (r: VisitRecord) => {
    if (r.visitType === "OUTPATIENT") {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{r.department || "-"}</span>
          <span className="text-xs text-muted-foreground">{r.institutionName}</span>
        </div>
      );
    }
    const deptLine = r.dischargeDept
      ? `${r.department || "-"} / ${r.dischargeDept}`
      : (r.department || "-");
    return (
      <div className="flex flex-col">
        <span className="font-medium">{deptLine}</span>
        <span className="text-xs text-muted-foreground">{r.institutionName}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("medical.title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          {t("medical.create")}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-32">
          <Select value={visitTypeFilter || null} onValueChange={(v) => { setVisitTypeFilter((v as VisitType) || ""); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("medical.filterType")}>
                {() => visitTypeFilter ? t(`medical.visitType.${visitTypeFilter}`) : t("medical.filterAllTypes")}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>{t("medical.filterAllTypes")}</SelectItem>
              <SelectItem value="OUTPATIENT">{t("medical.visitType.OUTPATIENT")}</SelectItem>
              <SelectItem value="INPATIENT">{t("medical.visitType.INPATIENT")}</SelectItem>
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select value={institutionFilter} onValueChange={(v) => { setInstitutionFilter(v as number | null); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("medical.filterInstitution")}>
                {() => institutionFilter ? institutions.find((i) => i.id === institutionFilter)?.name : t("medical.filterAllTypes")}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>{t("medical.filterAllTypes")}</SelectItem>
              {institutions.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={() => setInstitutionManagerOpen(true)}>
          <BuildingIcon className="size-3.5" />
          {t("medical.institutions")}
        </Button>

        <div className="w-32">
          <Select value={patientNameFilter || null} onValueChange={(v) => { setPatientNameFilter((v as string) || ""); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("medical.filterPatient")}>
                {() => patientNameFilter || t("medical.filterAllTypes")}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>{t("medical.filterAllTypes")}</SelectItem>
              {patientNames.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : pageData.empty ? (
        <div className="py-16 text-center text-muted-foreground">{t("medical.empty")}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("medical.columns.patient")}</TableHead>
                <TableHead>{t("medical.columns.department")}</TableHead>
                <TableHead>{t("medical.columns.time")}</TableHead>
                <TableHead>{t("medical.columns.doctor")}</TableHead>
                <TableHead className="w-20">{t("medical.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.content.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.patientName}</span>
                      <span className="text-xs text-muted-foreground">
                        {[
                          r.patientGender === "MALE" ? t("medical.gender.MALE") : r.patientGender === "FEMALE" ? t("medical.gender.FEMALE") : "",
                          r.patientAge != null ? `${r.patientAge}${t("medical.age")}` : "",
                        ].filter(Boolean).join(" ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDeptCell(r)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {formatTimeCell(r)}
                      <Badge variant="secondary" className="w-fit text-xs mt-0.5">
                        {r.visitType === "OUTPATIENT" ? t("medical.visitType.OUTPATIENT") : t("medical.visitType.INPATIENT")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{r.doctor || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => setDetailId(r.id)}>
                        <EyeIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setEditing(r)}>
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setDeleting(r)}>
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pageData.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={pageData.totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </>
      )}

      <CreateVisitDialog
        open={createOpen}
        institutions={institutions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { void fetchData(); }}
      />
      <CreateVisitDialog
        open={!!editing}
        initialData={editing}
        institutions={institutions}
        onClose={() => setEditing(null)}
        onSuccess={() => { void fetchData(); }}
      />
      <DeleteVisitDialog
        open={!!deleting}
        record={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={() => { void fetchData(); }}
      />
      <VisitDetailDrawer
        open={detailId !== null}
        visitId={detailId}
        onClose={() => setDetailId(null)}
        onRefresh={() => { void fetchData(); }}
      />
      <InstitutionManagerDialog
        open={institutionManagerOpen}
        onClose={() => setInstitutionManagerOpen(false)}
        onInstitutionsChange={(list) => setInstitutions(list)}
      />
    </div>
  );
};

export default MedicalRecordsPage;
