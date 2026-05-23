import axios from "./axios";

export interface MedicalInstitution {
  id: number;
  name: string;
  note: string | null;
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

export interface MedicalInstitutionRequest {
  name: string;
  note?: string;
}

export const getInstitutions = () =>
  axios.get<MedicalInstitution[]>("/medical-institutions");

export const getInstitutionsPage = (page = 0, size = 20, name?: string) =>
  axios.get<Page<MedicalInstitution>>("/medical-institutions/page", { params: { page, size, name } });

export const getInstitutionById = (id: number) =>
  axios.get<MedicalInstitution>(`/medical-institutions/${id}`);

export const createInstitution = (data: MedicalInstitutionRequest) =>
  axios.post<MedicalInstitution>("/medical-institutions", data);

export const updateInstitution = (id: number, data: MedicalInstitutionRequest) =>
  axios.put<MedicalInstitution>(`/medical-institutions/${id}`, data);

export const deleteInstitution = (id: number) =>
  axios.delete<void>(`/medical-institutions/${id}`);
