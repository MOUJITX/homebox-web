import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadIcon, TrashIcon, FileIcon, DownloadIcon } from "lucide-react";
import type { SubscriptionRecordAttachment } from "@/api/subscriptions";
import { syncSubscriptionRecordAttachments } from "@/api/subscriptionRecords";
import { Button } from "@/components/ui/button";
import { useFileSelectionSync } from "@/hooks/useFileSelectionSync";
import FilePickerDialog from "@/components/shared/FilePickerDialog";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface SubscriptionAttachmentManagerProps {
  readonly recordId: number;
  readonly attachments: SubscriptionRecordAttachment[];
  readonly onChanged: () => void;
}

const SubscriptionAttachmentManager = ({
  recordId,
  attachments,
  onChanged,
}: SubscriptionAttachmentManagerProps) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentFileIds = attachments.map((a) => a.fileId);

  const handleSync = async (fileIds: number[]) => {
    setUploading(true);
    try {
      await syncSubscriptionRecordAttachments(recordId, fileIds);
      onChanged();
    } finally {
      setUploading(false);
    }
  };

  const { handleSelect, handleDeselect } = useFileSelectionSync(
    currentFileIds,
    handleSync,
  );

  const handleDelete = async (fileId: number) => {
    setUploading(true);
    try {
      await syncSubscriptionRecordAttachments(
        recordId,
        currentFileIds.filter((id) => id !== fileId),
      );
      onChanged();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("common.upload")}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
          disabled={uploading}
        >
          <UploadIcon className="size-3.5" />
          {uploading ? "..." : t("common.upload")}
        </Button>
      </div>
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <div className="grid gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 overflow-hidden rounded-lg border p-2"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{att.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(att.fileSize)}
                </p>
              </div>
              <a href={att.url} download={att.filename}>
                <Button variant="ghost" size="icon-xs">
                  <DownloadIcon className="size-3.5" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => void handleDelete(att.fileId)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
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
        initialSelection={attachments.map((a) => ({
          id: a.fileId,
          storedFilename: "",
          originalFilename: a.filename,
          contentType: a.contentType,
          fileSize: a.fileSize,
          url: a.url,
          createdAt: a.createdAt,
          extractStatus: "SUCCESS" as const,
          chunkStatus: "SUCCESS" as const,
        }))}
      />
    </div>
  );
};

export default SubscriptionAttachmentManager;
