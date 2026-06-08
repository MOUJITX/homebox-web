import axios from "./axios";

export interface MedicalInstitution {
  id: number;
  name: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalInstitutionRequest {
  name: string;
  note?: string;
}

export const getInstitutions = () =>
  axios.get<MedicalInstitution[]>("/medical-institutions");

export const createInstitution = (data: MedicalInstitutionRequest) =>
  axios.post<MedicalInstitution>("/medical-institutions", data);

export const updateInstitution = (
  id: number,
  data: MedicalInstitutionRequest,
) => axios.put<MedicalInstitution>(`/medical-institutions/${id}`, data);

export const deleteInstitution = (id: number) =>
  axios.delete<void>(`/medical-institutions/${id}`);
