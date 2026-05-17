import axios from "@/api/axios";
import type { Page } from "@/api/goods";

export interface MedicationReminder {
  id: number;
  goodId: number;
  productName: string;
  categoryName: string;
  brandName: string;
  dosageMethod: string | null;
  dosageQuantity: string | null;
  dosageUnit: string | null;
  dosageNote: string | null;
  frequencyHours: string;
  courseStartDate: string;
  courseEndDate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationReminderRequest {
  goodId: number;
  dosageMethod?: string;
  dosageQuantity?: string;
  dosageUnit?: string;
  dosageNote?: string;
  frequencyHours: string;
  courseStartDate: string;
  courseEndDate: string;
  enabled?: boolean;
}

export interface UpdateMedicationReminderRequest {
  goodId?: number;
  dosageMethod?: string;
  dosageQuantity?: string;
  dosageUnit?: string;
  dosageNote?: string;
  frequencyHours?: string;
  courseStartDate?: string;
  courseEndDate?: string;
  enabled?: boolean;
}

export const getMedications = (page: number, size: number, enabled?: boolean) =>
  axios.get<Page<MedicationReminder>>("/medications", {
    params: { page, size, ...(enabled !== undefined && { enabled }) },
  });

export const getMedicationById = (id: number) =>
  axios.get<MedicationReminder>(`/medications/${id}`);

export const createMedication = (data: CreateMedicationReminderRequest) =>
  axios.post<MedicationReminder>("/medications", data);

export const updateMedication = (
  id: number,
  data: UpdateMedicationReminderRequest,
) => axios.put<MedicationReminder>(`/medications/${id}`, data);

export const deleteMedication = (id: number) =>
  axios.delete<void>(`/medications/${id}`);
