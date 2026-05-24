import axios from "./axios";

// ──────────────────────── Enums ────────────────────────

export type VisitType = "OUTPATIENT" | "INPATIENT";
export type Gender = "MALE" | "FEMALE";
export type VisitSourceType = "RECORD" | "EXAMINATION" | "LAB_TEST" | "PRESCRIPTION";

// ──────────────────────── Visit Record ────────────────────────

export interface VisitRecord {
  id: number;
  patientName: string;
  patientAge: number | null;
  patientGender: Gender | null;
  visitType: VisitType;
  visitDate: string;
  institutionId: number;
  institutionName: string;
  medicalContent: string | null;
  doctor: string | null;
  department: string | null;
  dischargeDate: string | null;
  dischargeDept: string | null;
  hospitalizationDays: number | null;
  examinationCount: number;
  labTestCount: number;
  prescriptionCount: number;
  attachmentCount: number;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetVisitRecordsParams {
  page?: number;
  size?: number;
  visitType?: VisitType;
  startDate?: string;
  endDate?: string;
  institutionId?: number;
  patientName?: string;
}

export interface CreateVisitRecordRequest {
  patientName: string;
  patientAge?: number;
  patientGender?: Gender;
  visitType: VisitType;
  visitDate: string;
  institutionId: number;
  medicalContent?: string;
  doctor?: string;
  department?: string;
  dischargeDate?: string;
  dischargeDept?: string;
}

export interface UpdateVisitRecordRequest {
  patientName?: string;
  patientAge?: number;
  patientGender?: Gender;
  visitType?: VisitType;
  visitDate?: string;
  institutionId?: number;
  medicalContent?: string;
  doctor?: string;
  department?: string;
  dischargeDate?: string;
  dischargeDept?: string;
}

export interface VisitRecordParseResult {
  patientName: string | null;
  patientAge: number | null;
  patientGender: Gender | null;
  visitType: VisitType | null;
  visitDate: string | null;
  medicalContent: string | null;
  doctor: string | null;
  department: string | null;
  dischargeDate: string | null;
  dischargeDept: string | null;
}

export const getVisitRecords = (params: GetVisitRecordsParams = {}) =>
  axios.get<Page<VisitRecord>>("/visit-records", { params });

export const getVisitRecordById = (id: number) =>
  axios.get<VisitRecord>(`/visit-records/${id}`);

export const getPatientNames = () =>
  axios.get<string[]>("/visit-records/patient-names");

export const createVisitRecord = (data: CreateVisitRecordRequest) =>
  axios.post<VisitRecord>("/visit-records", data);

export const updateVisitRecord = (id: number, data: UpdateVisitRecordRequest) =>
  axios.put<VisitRecord>(`/visit-records/${id}`, data);

export const deleteVisitRecord = (id: number) =>
  axios.delete<void>(`/visit-records/${id}`);

export const parseVisitRecord = (text: string) =>
  axios.post<VisitRecordParseResult>("/visit-records/parse", { text });

// ──────────────────────── Examination ────────────────────────

export interface VisitExamination {
  id: number;
  visitId: number;
  name: string;
  examDate: string | null;
  description: string | null;
  attachmentCount: number;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExaminationRequest {
  name: string;
  examDate?: string;
  description?: string;
}

export const getExaminations = (visitId: number, page = 0, size = 10) =>
  axios.get<Page<VisitExamination>>(`/visit-records/${visitId}/examinations`, { params: { page, size } });

export const getExaminationById = (id: number) =>
  axios.get<VisitExamination>(`/visit-records/0/examinations/${id}`);

export const createExamination = (visitId: number, data: CreateExaminationRequest) =>
  axios.post<VisitExamination>(`/visit-records/${visitId}/examinations`, data);

export const updateExamination = (id: number, data: CreateExaminationRequest) =>
  axios.put<VisitExamination>(`/visit-records/0/examinations/${id}`, data);

export const deleteExamination = (id: number) =>
  axios.delete<void>(`/visit-records/0/examinations/${id}`);

// ──────────────────────── Lab Test ────────────────────────

export interface VisitLabTest {
  id: number;
  visitId: number;
  name: string;
  testDate: string | null;
  description: string | null;
  attachmentCount: number;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabTestRequest {
  name: string;
  testDate?: string;
  description?: string;
}

export const getLabTests = (visitId: number, page = 0, size = 10) =>
  axios.get<Page<VisitLabTest>>(`/visit-records/${visitId}/lab-tests`, { params: { page, size } });

export const getLabTestById = (id: number) =>
  axios.get<VisitLabTest>(`/visit-records/0/lab-tests/${id}`);

export const createLabTest = (visitId: number, data: CreateLabTestRequest) =>
  axios.post<VisitLabTest>(`/visit-records/${visitId}/lab-tests`, data);

export const updateLabTest = (id: number, data: CreateLabTestRequest) =>
  axios.put<VisitLabTest>(`/visit-records/0/lab-tests/${id}`, data);

export const deleteLabTest = (id: number) =>
  axios.delete<void>(`/visit-records/0/lab-tests/${id}`);

// ──────────────────────── Prescription ────────────────────────

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  medicationReminderId: number;
  medicationName: string;
  dosageMethod: string | null;
  dosageQuantity: string | null;
  dosageUnit: string | null;
  note: string | null;
  createdAt: string;
}

export interface VisitPrescription {
  id: number;
  visitId: number;
  prescriptionDate: string | null;
  description: string | null;
  items: PrescriptionItem[];
  attachmentCount: number;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionRequest {
  prescriptionDate?: string;
  description?: string;
}

export interface CreatePrescriptionItemRequest {
  medicationReminderId: number;
  note?: string;
}

export const getPrescriptions = (visitId: number, page = 0, size = 10) =>
  axios.get<Page<VisitPrescription>>(`/visit-records/${visitId}/prescriptions`, { params: { page, size } });

export const getPrescriptionById = (id: number) =>
  axios.get<VisitPrescription>(`/visit-records/0/prescriptions/${id}`);

export const createPrescription = (visitId: number, data: CreatePrescriptionRequest) =>
  axios.post<VisitPrescription>(`/visit-records/${visitId}/prescriptions`, data);

export const updatePrescription = (id: number, data: CreatePrescriptionRequest) =>
  axios.put<VisitPrescription>(`/visit-records/0/prescriptions/${id}`, data);

export const deletePrescription = (id: number) =>
  axios.delete<void>(`/visit-records/0/prescriptions/${id}`);

export const addPrescriptionItem = (prescriptionId: number, data: CreatePrescriptionItemRequest) =>
  axios.post<PrescriptionItem>(`/visit-records/0/prescriptions/${prescriptionId}/items`, data);

export const updatePrescriptionItem = (itemId: number, data: CreatePrescriptionItemRequest) =>
  axios.put<PrescriptionItem>(`/visit-records/0/prescriptions/0/items/${itemId}`, data);

export const deletePrescriptionItem = (itemId: number) =>
  axios.delete<void>(`/visit-records/0/prescriptions/0/items/${itemId}`);

// ──────────────────────── Attachments ────────────────────────

export interface VisitAttachment {
  id: number;
  visitId: number;
  fileId: number;
  originalFilename: string;
  fileSize: number;
  url: string;
  sourceType: VisitSourceType;
  sourceId: number;
  createdAt: string;
}

export const getVisitAttachments = (visitId: number) =>
  axios.get<VisitAttachment[]>(`/visit-records/${visitId}/attachments`);

export const uploadVisitAttachment = (visitId: number, file: File, sourceType: VisitSourceType, sourceId: number) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sourceType", sourceType);
  formData.append("sourceId", String(sourceId));
  return axios.post<VisitAttachment>(`/visit-records/${visitId}/attachments`, formData);
};

export const deleteVisitAttachment = (id: number) =>
  axios.delete<void>(`/visit-records/0/attachments/${id}`);

// ──────────────────────── Invoices ────────────────────────

export interface VisitInvoice {
  id: number;
  visitId: number;
  invoiceId: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceType: string;
  totalAmount: number;
  sourceType: VisitSourceType;
  sourceId: number;
  createdAt: string;
}

export const getVisitInvoices = (visitId: number) =>
  axios.get<VisitInvoice[]>(`/visit-records/${visitId}/invoices`);

export const bindVisitInvoice = (visitId: number, invoiceId: number, sourceType: VisitSourceType, sourceId: number) =>
  axios.post<VisitInvoice>(`/visit-records/${visitId}/invoices`, { invoiceId, sourceType, sourceId });

export const unbindVisitInvoice = (id: number) =>
  axios.delete<void>(`/visit-records/0/invoices/${id}`);
