import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileIcon,
  FileTextIcon,
  FileAudioIcon,
  FileVideoIcon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  UploadIcon,
  CheckIcon,
  SearchIcon,
} from "lucide-react";
import { getFiles, uploadFile, type FileRecord } from "@/api/files";
import type { Page } from "@/api/goods";
import { useDebounce } from "@/hooks/useDebounce";
import { formatFileSize } from "@/lib/utils";
import AuthImg from "@/components/AuthImg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";

type ViewMode = "grid" | "list";

const CONTENT_TYPE_OPTIONS = [
  { value: "image/", labelKey: "filePicker.typeImage" },
  { value: "video/", labelKey: "filePicker.typeVideo" },
  { value: "audio/", labelKey: "filePicker.typeAudio" },
  { value: "application/pdf", labelKey: "filePicker.typePdf" },
  { value: "text/", labelKey: "filePicker.typeText" },
] as const;

const isImageType = (contentType: string) => contentType.startsWith("image/");

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith("image/")) return ImageIcon;
  if (contentType.startsWith("video/")) return FileVideoIcon;
  if (contentType.startsWith("audio/")) return FileAudioIcon;
  if (contentType.startsWith("text/")) return FileTextIcon;
  return FileIcon;
};

interface FilePickerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (files: FileRecord[]) => void;
  readonly onDeselect?: (files: FileRecord[]) => void;
  readonly multiple?: boolean;
  readonly accept?: string;
  readonly initialSelection?: FileRecord[];
}

const FilePickerDialog = ({
  open,
  onClose,
  onSelect,
  onDeselect,
  multiple = false,
  accept,
  initialSelection,
}: FilePickerDialogProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSelectionRef = useRef<FileRecord[]>([]);

  const defaultView: ViewMode =
    accept && accept.startsWith("image/") ? "grid" : "list";
  // Derive locked content type from accept (e.g. "image/*" -> "image/")
  const lockedContentType =
    accept && accept.includes("*") ? accept.replace("*", "") : null;
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterContentType, setFilterContentType] = useState<string | null>(
    lockedContentType ?? (accept && !accept.includes("*") ? accept : null),
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [pageData, setPageData] = useState<Page<FileRecord> | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<FileRecord[]>([]);

  const fetchFiles = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const { data } = await getFiles(p, pageSize, {
          search: debouncedSearch || undefined,
          contentType: filterContentType ?? undefined,
        });
        setPageData(data);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, debouncedSearch, filterContentType],
  );

  useEffect(() => {
    if (open) void fetchFiles(page);
  }, [open, fetchFiles, page]);

  useEffect(() => {
    if (open) {
      const initial = initialSelection ?? [];
      setViewMode(defaultView);
      setSearch("");
      setFilterContentType(
        lockedContentType ?? (accept && !accept.includes("*") ? accept : null),
      );
      setPage(0);
      setSelected(initial);
      initialSelectionRef.current = initial;
    }
  }, [open, defaultView, accept, lockedContentType]);

  const handleToggleSelect = (file: FileRecord) => {
    setSelected((prev) => {
      const exists = prev.find((f) => f.id === file.id);
      if (exists) {
        return prev.filter((f) => f.id !== file.id);
      }
      return multiple ? [...prev, file] : [file];
    });
  };

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const results = await Promise.all(
        Array.from(files).map((f) => uploadFile(f)),
      );
      const newRecords = results.map((r) => r.data);
      setSelected((prev) =>
        multiple
          ? [...prev, ...newRecords]
          : newRecords.length > 0
            ? [newRecords[0]]
            : prev,
      );
      void fetchFiles(page);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    const initialIds = new Set(initialSelectionRef.current.map((f) => f.id));
    const added = selected.filter((f) => !initialIds.has(f.id));
    const removed = initialSelectionRef.current.filter(
      (f) => !selected.some((s) => s.id === f.id),
    );
    if (added.length > 0) onSelect(added);
    if (removed.length > 0) onDeselect?.(removed);
    onClose();
  };

  const totalPages = pageData?.totalPages ?? 1;
  // Merge: show selected files that aren't in the current page at the beginning
  const rawFiles = pageData?.content ?? [];
  const selectedNotInPage = selected.filter(
    (s) => !rawFiles.some((f) => f.id === s.id),
  );
  const files = [...selectedNotInPage, ...rawFiles];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {multiple ? t("filePicker.titleMulti") : t("filePicker.title")}
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={t("filePicker.searchPlaceholder")}
              className="pl-8"
            />
          </div>

          <div className="w-36">
            <Select
              value={filterContentType}
              onValueChange={(v) => {
                setFilterContentType(v);
                setPage(0);
              }}
              disabled={lockedContentType != null}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filePicker.allTypes")}>
                  {() =>
                    filterContentType == null
                      ? t("filePicker.allTypes")
                      : t(
                          CONTENT_TYPE_OPTIONS.find(
                            (o) => o.value === filterContentType,
                          )?.labelKey ?? "filePicker.allTypes",
                        )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value={null}>
                  {t("filePicker.allTypes")}
                </SelectItem>
                {CONTENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
              title={t("filePicker.gridView")}
            >
              <LayoutGridIcon className="size-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
              title={t("filePicker.listView")}
            >
              <ListIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* File list */}
        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          {loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          )}
          {!loading && files.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("filePicker.noFiles")}
            </p>
          )}
          {!loading && files.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {files.map((file) => {
                const isSelected = selected.some((f) => f.id === file.id);
                return (
                  <button
                    key={file.id}
                    className={`group relative flex flex-col items-center gap-1 rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-foreground/10 hover:border-foreground/20"
                    }`}
                    onClick={() => handleToggleSelect(file)}
                  >
                    {isImageType(file.contentType) ? (
                      <AuthImg
                        url={file.url}
                        alt={file.originalFilename}
                        className="size-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded bg-muted">
                        {(() => {
                          const Icon = getFileIcon(file.contentType);
                          return <Icon className="size-6 text-muted-foreground" />;
                        })()}
                      </div>
                    )}
                    <span className="w-full truncate text-center text-xs">
                      {file.originalFilename}
                    </span>
                    {isSelected && multiple && (
                      <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {selected.findIndex((f) => f.id === file.id) + 1}
                      </div>
                    )}
                    {isSelected && !multiple && (
                      <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckIcon className="size-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!loading && files.length > 0 && viewMode === "list" && (
            <div className="grid gap-1">
              {files.map((file) => {
                const isSelected = selected.some((f) => f.id === file.id);
                const Icon = getFileIcon(file.contentType);
                return (
                  <button
                    key={file.id}
                    className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-foreground/10 hover:border-foreground/20"
                    }`}
                    onClick={() => handleToggleSelect(file)}
                  >
                    {isImageType(file.contentType) ? (
                      <AuthImg
                        url={file.url}
                        alt={file.originalFilename}
                        className="size-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                        <Icon className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.originalFilename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                    {isSelected && multiple && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {selected.findIndex((f) => f.id === file.id) + 1}
                      </span>
                    )}
                    {isSelected && !multiple && (
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t pt-2">
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
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                className="hidden"
                onChange={handleUploadNew}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="size-3.5" />
                {uploading ? t("common.uploading") : t("filePicker.uploadNew")}
              </Button>
              {selected.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {t("filePicker.selectedCount", { count: selected.length })}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button disabled={selected.length === 0} onClick={handleConfirm}>
                {t("filePicker.confirm")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePickerDialog;
