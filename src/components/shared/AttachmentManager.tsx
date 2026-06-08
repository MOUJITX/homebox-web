import { useRef, useState } from "react";
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

export interface AttachmentItem {
  id: number;
  filename: string;
  fileSize: number;
  url?: string;
  indexed?: boolean;
}

interface AttachmentManagerProps {
  readonly attachments: AttachmentItem[];
  readonly onUpload: (file: File) => Promise<void>;
  readonly onDelete: (id: number) => Promise<void>;
}

const AttachmentManager = ({
  attachments,
  onUpload,
  onDelete,
}: AttachmentManagerProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("shared.attachments.title")}</h4>
        <div>
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
              ? t("shared.attachments.uploading")
              : t("shared.attachments.upload")}
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("shared.attachments.empty")}
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
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(a.fileSize)}
                  {a.indexed === false && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                      <LoaderIcon className="size-3 animate-spin" />
                      {t("shared.attachments.indexing")}
                    </span>
                  )}
                </p>
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
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => void onDelete(a.id)}
                title="Delete"
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

export default AttachmentManager;
