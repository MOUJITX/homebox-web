import axios from "@/api/axios";

export interface SystemConfigItem {
  key: string;
  value: string;
  sensitive: boolean;
  description: string;
}

export interface SystemConfigGroupResponse {
  group: string;
  items: SystemConfigItem[];
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

export const getSystemConfigGroup = (group: string) =>
  axios.get<SystemConfigGroupResponse>("/system-config", { params: { group } });

export const saveSystemConfigGroup = (group: string, data: Record<string, string>) =>
  axios.put(`/system-config/${group}`, data);

export const testQiniuConnection = () =>
  axios.post<TestConnectionResponse>("/system-config/test/qiniu");

export const testAiConnection = () =>
  axios.post<TestConnectionResponse>("/system-config/test/ai");
