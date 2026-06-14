import axios from "./axios";

export interface SourceInfo {
  type: "ASSET" | "GOOD" | "INVOICE" | "FILE" | "SUBSCRIPTION" | "DOCUMENT";
  typeLabel: string | null;
  sourceId: number | null;
  sourceName: string | null;
}

export interface MatchInfo {
  chunkId: number;
  page: number | null;
  snippet: string;
  matchTerms: string[];
}

export interface SearchResultItem {
  fileId: number;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  sources: SourceInfo[];
  matches: MatchInfo[];
  score: number;
}

export interface SearchResponse {
  content: SearchResultItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const searchContent = (q: string, page = 0, size = 20) =>
  axios.get<SearchResponse>("/search", { params: { q, page, size } });

export const getSearchStatus = () =>
  axios.get<{ available: boolean }>("/search/status");
