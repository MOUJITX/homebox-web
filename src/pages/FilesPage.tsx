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
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
} from "lucide-react";
import {
  getFiles,
  uploadFile,
  renameFile,
  deleteFile,
  getFilePreviewUrl,
  getFileDownloadUrl,
  type FileRecord,
} from "@/api/files";
import type { Page } from "@/api/goods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const PAGE_SIZE = 20;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const isImageType = (contentType: string) => contentType.startsWith("image/");

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith("video/")) return FileVideoIcon;
  if (contentType.startsWith("audio/")) return FileAudioIcon;
  if (contentType.startsWith("text/")) return FileTextIcon;
  return FileIcon;
};

const FilesPage = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [pageData, setPageData] = useState<Page<FileRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingFile, setDeletingFile] = useState<FileRecord | null>(null);

  const fetchFiles = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await getFiles(p, PAGE_SIZE);
      setPageData(data);
      setFiles(data.content);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFiles(page);
  }, [fetchFiles, page]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        await uploadFile(file);
      }
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

  const totalPages = pageData?.totalPages ?? 1;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-semibold">
          {t("files.title")}
        </h1>
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
              <TableHead className="text-right">
                {t("files.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && files.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("files.empty")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              files.map((file) => {
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
                            src={getFilePreviewUrl(file.id)}
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
                      {formatDate(file.createdAt)}
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
                        <a href={getFileDownloadUrl(file.id)} download>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("common.pageInfo", {
              current: page + 1,
              total: totalPages,
            })}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="max-w-3xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>{previewFile?.originalFilename}</DialogTitle>
          </DialogHeader>
          {previewFile && isImageType(previewFile.contentType) ? (
            <img
              src={getFilePreviewUrl(previewFile.id)}
              alt={previewFile.originalFilename}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          ) : previewFile ? (
            <div className="flex flex-col items-center gap-3 py-8">
              {(() => {
                const Icon = getFileIcon(previewFile.contentType);
                return <Icon className="size-12 text-muted-foreground" />;
              })()}
              <p className="text-sm text-muted-foreground">
                {previewFile.contentType} &middot;{" "}
                {formatFileSize(previewFile.fileSize)}
              </p>
              <a href={getFileDownloadUrl(previewFile.id)} download>
                <Button>
                  <DownloadIcon className="size-4" />
                  {t("files.download")}
                </Button>
              </a>
            </div>
          ) : null}
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
