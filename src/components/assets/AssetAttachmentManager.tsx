import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadIcon, TrashIcon, FileIcon, DownloadIcon, LoaderIcon } from "lucide-react";
import type { AssetAttachment } from "@/api/assetAttachments";
import {
  uploadAssetAttachment,
  deleteAssetAttachment,
} from "@/api/assetAttachments";
import { Button } from "@/components/ui/button";

interface AssetAttachmentManagerProps {
  readonly assetId: number;
  readonly attachments: AssetAttachment[];
  readonly onChanged: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AssetAttachmentManager = ({
  assetId,
  attachments,
  onChanged,
}: AssetAttachmentManagerProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        await uploadAssetAttachment(assetId, file);
        onChanged();
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [assetId, onChanged],
  );

  const handleDelete = useCallback(
    async (attachmentId: number) => {
      await deleteAssetAttachment(assetId, attachmentId);
      onChanged();
    },
    [assetId, onChanged],
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {t("assets.attachments.title")}
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
          {uploading
            ? t("assets.attachments.uploading")
            : t("assets.attachments.upload")}
        </Button>
      </div>
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("assets.attachments.empty")}
        </p>
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
                  {!att.indexed && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                      <LoaderIcon className="size-3 animate-spin" />
                      {t("assets.attachments.indexing")}
                    </span>
                  )}
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

export default AssetAttachmentManager;
