import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectPopup, SelectItem, SelectValue } from "@/components/ui/select";
import {
  createVisitRecord,
  updateVisitRecord,
  type CreateVisitRecordRequest,
  type VisitRecord,
  type VisitType,
  type Gender,
} from "@/api/medical";
import type { MedicalInstitution } from "@/api/institutions";
import PasteVisitTextDialog from "./PasteVisitTextDialog";

interface Props {
  open: boolean;
  initialData?: VisitRecord | null;
  institutions: MedicalInstitution[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateVisitDialog = ({ open, initialData, institutions, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<Gender | "">("");
  const [visitType, setVisitType] = useState<VisitType>("OUTPATIENT");
  const [visitDate, setVisitDate] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [medicalContent, setMedicalContent] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [doctor, setDoctor] = useState("");
  const [department, setDepartment] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeDept, setDischargeDept] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [parseOpen, setParseOpen] = useState(false);

  const resetForm = () => {
    setPatientName(""); setPatientAge(""); setPatientGender("");
    setVisitType("OUTPATIENT"); setVisitDate(""); setInstitutionId("");
    setMedicalContent(""); setDiagnosis(""); setDoctor(""); setDepartment("");
    setDischargeDate(""); setDischargeDept("");
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        setPatientName(initialData.patientName);
        setPatientAge(initialData.patientAge != null ? String(initialData.patientAge) : "");
        setPatientGender(initialData.patientGender ?? "");
        setVisitType(initialData.visitType);
        setVisitDate(initialData.visitDate);
        setInstitutionId(String(initialData.institutionId));
        setMedicalContent(initialData.medicalContent ?? "");
        setDiagnosis(initialData.diagnosis ?? "");
        setDoctor(initialData.doctor ?? "");
        setDepartment(initialData.department ?? "");
        setDischargeDate(initialData.dischargeDate ?? "");
        setDischargeDept(initialData.dischargeDept ?? "");
      } else {
        resetForm();
      }
    }
  }, [open, initialData]);

  const applyParseResult = (result: Record<string, unknown>) => {
    if (result.patientName) setPatientName(result.patientName as string);
    if (result.patientAge != null) setPatientAge(String(result.patientAge));
    if (result.patientGender) setPatientGender(result.patientGender as Gender);
    if (result.visitType) setVisitType(result.visitType as VisitType);
    if (result.visitDate) setVisitDate(result.visitDate as string);
    if (result.medicalContent) setMedicalContent(result.medicalContent as string);
    if (result.diagnosis) setDiagnosis(result.diagnosis as string);
    if (result.doctor) setDoctor(result.doctor as string);
    if (result.department) setDepartment(result.department as string);
    if (result.dischargeDate) setDischargeDate(result.dischargeDate as string);
    if (result.dischargeDept) setDischargeDept(result.dischargeDept as string);
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !visitDate || !institutionId) return;
    setSubmitting(true);
    try {
      const data: CreateVisitRecordRequest = {
        patientName: patientName.trim(), visitType, visitDate,
        institutionId: Number(institutionId),
      };
      if (patientAge) data.patientAge = Number(patientAge);
      if (patientGender) data.patientGender = patientGender;
      if (medicalContent) data.medicalContent = medicalContent;
      if (diagnosis) data.diagnosis = diagnosis;
      if (doctor) data.doctor = doctor;
      if (department) data.department = department;
      if (dischargeDate) data.dischargeDate = dischargeDate;
      if (dischargeDept) data.dischargeDept = dischargeDept;

      if (isEdit && initialData) {
        await updateVisitRecord(initialData.id, data);
      } else {
        await createVisitRecord(data);
      }
      onClose(); onSuccess();
    } catch { /* handled by interceptor */ }
    finally { setSubmitting(false); }
  };

  const isInpatient = visitType === "INPATIENT";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{isEdit ? t("medical.edit") : t("medical.create")}</DialogTitle>
              <Button variant="outline" size="sm" onClick={() => setParseOpen(true)}>
                {t("medical.parsePaste")}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto p-0.5">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">{t("medical.form.patientName")} *</label>
                <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder={t("medical.form.patientNamePlaceholder")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">{t("medical.form.patientAge")}</label>
                <Input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder={t("medical.form.patientAgePlaceholder")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">{t("medical.form.patientGender")}</label>
                <Select value={patientGender || null} onValueChange={(v) => setPatientGender((v as Gender) || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="">{() => patientGender ? t(`medical.gender.${patientGender}`) : ""}</SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value={null}>-</SelectItem>
                    <SelectItem value="MALE">{t("medical.gender.MALE")}</SelectItem>
                    <SelectItem value="FEMALE">{t("medical.gender.FEMALE")}</SelectItem>
                  </SelectPopup>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">{t("medical.form.institution")} *</label>
                <Select value={institutionId || null} onValueChange={(v) => setInstitutionId(v ? String(v) : "")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("medical.form.institutionPlaceholder")}>
                      {() => institutionId ? institutions.find((i) => i.id === Number(institutionId))?.name : ""}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {institutions.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
                  </SelectPopup>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">{t("medical.form.visitType")} *</label>
                <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitType)}>
                  <SelectTrigger>
                    <SelectValue>{() => t(`medical.visitType.${visitType}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="OUTPATIENT">{t("medical.visitType.OUTPATIENT")}</SelectItem>
                    <SelectItem value="INPATIENT">{t("medical.visitType.INPATIENT")}</SelectItem>
                  </SelectPopup>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {isInpatient ? t("medical.form.admissionDept") : t("medical.form.department")}
                </label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {isInpatient ? t("medical.form.admissionDate") : t("medical.form.visitDate")} *
                </label>
                <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </div>
            </div>

            {isInpatient && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">{t("medical.form.dischargeDept")}</label>
                  <Input value={dischargeDept} onChange={(e) => setDischargeDept(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">{t("medical.form.dischargeDate")}</label>
                  <Input type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">{t("medical.form.medicalContent")}</label>
              <textarea
                className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none min-h-20"
                value={medicalContent}
                onChange={(e) => setMedicalContent(e.target.value)}
                placeholder={t("medical.form.medicalContentPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">{t("medical.form.diagnosis")}</label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder={t("medical.form.diagnosisPlaceholder")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">{t("medical.form.doctor")}</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder={t("medical.form.doctorPlaceholder")} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !patientName.trim() || !visitDate || !institutionId}>
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasteVisitTextDialog
        open={parseOpen}
        onClose={() => setParseOpen(false)}
        onApply={(result) => { applyParseResult(result); setParseOpen(false); }}
      />
    </>
  );
};

export default CreateVisitDialog;
