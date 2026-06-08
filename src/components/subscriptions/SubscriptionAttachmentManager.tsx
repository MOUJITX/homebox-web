import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadIcon, TrashIcon, FileIcon, DownloadIcon } from "lucide-react";
import type { SubscriptionRecordAttachment } from "@/api/subscriptions";
import { uploadAttachment, deleteAttachment } from "@/api/subscriptionRecords";
import { Button } from "@/components/ui/button";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        await uploadAttachment(recordId, file);
        onChanged();
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [recordId, onChanged],
  );

  const handleDelete = useCallback(
    async (attachmentId: number) => {
      await deleteAttachment(recordId, attachmentId);
      onChanged();
    },
    [recordId, onChanged],
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {t("subscriptions.attachments.upload")}
        </h4>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <UploadIcon className="size-3.5" />
          {uploading ? "..." : t("subscriptions.attachments.upload")}
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
                onClick={() => handleDelete(att.id)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionAttachmentManager;
