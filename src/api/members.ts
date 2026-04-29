import axios from "./axios";

export interface Member {
  id: number;
  username: string;
  displayName: string;
  roleName: string;
  forceChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  username: string;
  password: string;
  displayName: string;
  roleName: string;
}

export interface UpdateMemberRequest {
  displayName?: string;
  roleName?: string;
  password?: string;
}

export const getMembers = () => axios.get<Member[]>("/members");

export const createMember = (data: CreateMemberRequest) =>
  axios.post<Member>("/members", data);

export const updateMember = (id: number, data: UpdateMemberRequest) =>
  axios.put<Member>(`/members/${id}`, data);

export const deleteMember = (id: number) =>
  axios.delete<void>(`/members/${id}`);
