import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UploadIcon,
  DownloadIcon,
  PencilIcon,
  TrashIcon,
  FileIcon,
  FileTextIcon,
  FileAudioIcon,
  FileVideoIcon,
  ImageIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import {
  getFiles,
  uploadFile,
  renameFile,
  deleteFile,
  retryFile,
  type FileRecord,
  type ProcessStatus,
} from "@/api/files";
import type { Page } from "@/api/goods";
import { formatDateTime } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

import ImagePreview from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Pagination } from "@/components/ui/pagination";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const isImageType = (contentType: string) => contentType.startsWith("image/");

const CONTENT_TYPE_OPTIONS = [
  { value: "image/", labelKey: "files.filters.typeImage" },
  { value: "video/", labelKey: "files.filters.typeVideo" },
  { value: "audio/", labelKey: "files.filters.typeAudio" },
  { value: "application/pdf", labelKey: "files.filters.typePdf" },
  { value: "text/", labelKey: "files.filters.typeText" },
] as const;

const STATUS_OPTIONS: ProcessStatus[] = ["SUCCESS", "PROCESSING", "FAILED"];

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith("video/")) return FileVideoIcon;
  if (contentType.startsWith("audio/")) return FileAudioIcon;
  if (contentType.startsWith("text/")) return FileTextIcon;
  return FileIcon;
};

const getFinalStatus = (
  extract: ProcessStatus,
  chunk: ProcessStatus,
): ProcessStatus => {
  if (extract === "FAILED" || chunk === "FAILED") return "FAILED";
  if (extract === "SUCCESS" && chunk === "SUCCESS") return "SUCCESS";
  return "PROCESSING";
};

const FilesPage = () => {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<Page<FileRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterContentType, setFilterContentType] = useState<string | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingFile, setDeletingFile] = useState<FileRecord | null>(null);
  const [retrying, setRetrying] = useState<Set<number>>(new Set());

  const fetchFiles = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const { data } = await getFiles(p, pageSize, {
          search: debouncedSearch || undefined,
          contentType: filterContentType ?? undefined,
          status: filterStatus ?? undefined,
        });
        setPageData(data);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, debouncedSearch, filterContentType, filterStatus],
  );

  useEffect(() => {
    void fetchFiles(page);
  }, [fetchFiles, page]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    setUploading(true);
    try {
      await Promise.all(Array.from(selected).map((file) => uploadFile(file)));
      void fetchFiles(page);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRename = async () => {
    if (!renamingFile || !renameValue.trim()) return;
    await renameFile(renamingFile.id, renameValue.trim());
    setRenamingFile(null);
    void fetchFiles(page);
  };

  const handleDelete = async () => {
    if (!deletingFile) return;
    await deleteFile(deletingFile.id);
    setDeletingFile(null);
    void fetchFiles(page);
  };

  const handleRetry = async (fileId: number) => {
    setRetrying((prev) => new Set(prev).add(fileId));
    try {
      await retryFile(fileId);
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      void fetchFiles(page);
    }
  };

  const totalPages = pageData?.totalPages ?? 1;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t("files.filters.searchPlaceholder")}
            className="pl-8"
          />
        </div>

        <div className="w-40">
          <Select
            value={filterContentType}
            onValueChange={(v) => {
              setFilterContentType(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("files.filters.allTypes")}>
                {() =>
                  filterContentType == null
                    ? t("files.filters.allTypes")
                    : t(
                        CONTENT_TYPE_OPTIONS.find(
                          (o) => o.value === filterContentType,
                        )?.labelKey ?? "files.filters.allTypes",
                      )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("files.filters.allTypes")}
              </SelectItem>
              {CONTENT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("files.filters.allStatus")}>
                {() =>
                  filterStatus == null
                    ? t("files.filters.allStatus")
                    : t(`files.status.${filterStatus}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("files.filters.allStatus")}
              </SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`files.status.${s}`)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="ml-auto flex gap-1">
          <Button
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="size-4" />
            {uploading ? t("files.uploading") : t("files.upload")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                {t("files.columns.preview")}
              </TableHead>
              <TableHead>{t("files.columns.filename")}</TableHead>
              <TableHead>{t("files.columns.contentType")}</TableHead>
              <TableHead>{t("files.columns.fileSize")}</TableHead>
              <TableHead>{t("files.columns.createdAt")}</TableHead>
              <TableHead className="w-24">
                {t("files.columns.status")}
              </TableHead>
              <TableHead className="text-right">
                {t("files.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && (pageData?.content.length ?? 0) === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("files.empty")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              (pageData?.content ?? []).map((file) => {
                const Icon = getFileIcon(file.contentType);
                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      {isImageType(file.contentType) ? (
                        <button
                          className="block size-12 overflow-hidden rounded-md ring-1 ring-foreground/10 transition-opacity hover:opacity-80"
                          onClick={() => setPreviewFile(file)}
                        >
                          <img
                            src={file.url}
                            alt={file.originalFilename}
                            className="size-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md bg-muted">
                          <Icon className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {file.originalFilename}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.contentType}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(file.createdAt)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getFinalStatus(
                          file.extractStatus,
                          file.chunkStatus,
                        );
                        const isRetrying = retrying.has(file.id);
                        return (
                          <div className="flex items-center gap-1.5">
                            {status === "SUCCESS" && (
                              <CheckCircleIcon className="size-4 text-green-500" />
                            )}
                            {status === "FAILED" && (
                              <XCircleIcon className="size-4 text-red-500" />
                            )}
                            {(status === "PROCESSING" ||
                              status === "PENDING") && (
                              <ClockIcon className="size-4 text-amber-500" />
                            )}
                            <span className="text-xs">
                              {t(`files.status.${status}`)}
                            </span>
                            {status === "FAILED" && (
                              <button
                                className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                                disabled={isRetrying}
                                title={t("files.retry")}
                                onClick={() => void handleRetry(file.id)}
                              >
                                <RefreshCwIcon
                                  className={`size-3.5 ${isRetrying ? "animate-spin" : ""}`}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isImageType(file.contentType) && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title={t("files.preview")}
                            onClick={() => setPreviewFile(file)}
                          >
                            <ImageIcon className="size-3.5" />
                          </Button>
                        )}
                        <a href={file.url} download={file.originalFilename}>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title={t("files.download")}
                          >
                            <DownloadIcon className="size-3.5" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title={t("files.rename")}
                          onClick={() => {
                            setRenamingFile(file);
                            setRenameValue(file.originalFilename);
                          }}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title={t("files.delete")}
                          onClick={() => setDeletingFile(file)}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
      />

      <ImagePreview
        url={
          previewFile && isImageType(previewFile.contentType)
            ? previewFile.url
            : null
        }
        open={!!(previewFile && isImageType(previewFile.contentType))}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />

      {/* Non-Image Preview Dialog */}
      <Dialog
        open={!!(previewFile && !isImageType(previewFile.contentType))}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="max-w-3xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>{previewFile?.originalFilename}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex flex-col items-center gap-3 py-8">
              {(() => {
                const Icon = getFileIcon(previewFile.contentType);
                return <Icon className="size-12 text-muted-foreground" />;
              })()}
              <p className="text-sm text-muted-foreground">
                {previewFile.contentType} &middot;{" "}
                {formatFileSize(previewFile.fileSize)}
              </p>
              <a href={previewFile.url} download={previewFile.originalFilename}>
                <Button>
                  <DownloadIcon className="size-4" />
                  {t("files.download")}
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!renamingFile}
        onOpenChange={(open) => !open && setRenamingFile(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("files.rename")}</DialogTitle>
            <DialogDescription>
              {t("files.renameDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rename-input">{t("files.newFilename")}</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={t("files.newFilenamePlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && void handleRename()}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button onClick={() => void handleRename()}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && setDeletingFile(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("files.delete")}</DialogTitle>
            <DialogDescription>{t("files.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilesPage;
