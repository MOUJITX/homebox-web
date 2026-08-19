import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UploadIcon,
  FileIcon,
  TrashIcon,
  DownloadIcon,
  LoaderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import { useFileSelectionSync } from "@/hooks/useFileSelectionSync";
import FilePickerDialog from "./FilePickerDialog";

export interface AttachmentItem {
  id: number;
  fileId?: number;
  filename: string;
  fileSize?: number;
  url?: string;
  indexed?: boolean;
  deletable?: boolean;
}

interface AttachmentManagerProps {
  readonly attachments: AttachmentItem[];
  readonly onSync: (fileIds: number[]) => Promise<void>;
}

const AttachmentManager = ({ attachments, onSync }: AttachmentManagerProps) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const currentFileIds = attachments
    .filter((a) => a.fileId != null && a.deletable !== false)
    .map((a) => a.fileId!);

  const handleSync = async (fileIds: number[]) => {
    setSyncing(true);
    try {
      await onSync(fileIds);
    } finally {
      setSyncing(false);
    }
  };

  const { handleSelect, handleDeselect } = useFileSelectionSync(
    currentFileIds,
    handleSync,
  );

  const handleDelete = async (fileId: number) => {
    setSyncing(true);
    try {
      await onSync(currentFileIds.filter((id) => id !== fileId));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("common.attachments")}</h4>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            disabled={syncing}
          >
            <UploadIcon className="size-3.5" />
            {syncing ? t("common.uploading") : t("common.upload")}
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("common.noAttachments")}
        </p>
      ) : (
        <div className="grid gap-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 overflow-hidden rounded-lg border p-2"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.filename}</p>
                {(a.fileSize != null || a.indexed === false) && (
                  <p className="text-xs text-muted-foreground">
                    {a.fileSize != null && formatFileSize(a.fileSize)}
                    {a.indexed === false && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                        <LoaderIcon className="size-3 animate-spin" />
                        {t("common.indexing")}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {a.url && (
                <a href={a.url} download={a.filename}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    type="button"
                    title="Download"
                  >
                    <DownloadIcon className="size-3.5" />
                  </Button>
                </a>
              )}
              {a.deletable !== false && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    if (a.fileId != null) void handleDelete(a.fileId);
                  }}
                  title="Delete"
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <FilePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        onDeselect={handleDeselect}
        multiple
        initialSelection={attachments
          .filter((a) => a.fileId != null)
          .map((a) => ({
            id: a.fileId!,
            storedFilename: "",
            originalFilename: a.filename,
            contentType: "",
            fileSize: a.fileSize ?? 0,
            url: a.url ?? "",
            createdAt: "",
            extractStatus: "SUCCESS" as const,
            chunkStatus: "SUCCESS" as const,
          }))}
      />
    </div>
  );
};

export default AttachmentManager;
