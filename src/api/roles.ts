import axios from "./axios";

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export const getRoles = () => axios.get<Role[]>("/roles");

export const createRole = (data: CreateRoleRequest) =>
  axios.post<Role>("/roles", data);

export const updateRole = (id: number, data: UpdateRoleRequest) =>
  axios.put<Role>(`/roles/${id}`, data);

export const deleteRole = (id: number) => axios.delete<void>(`/roles/${id}`);
