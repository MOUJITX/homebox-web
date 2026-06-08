import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UploadIcon,
  FileIcon,
  TrashIcon,
  DownloadIcon,
  LoaderIcon,
} from "lucide-react";
import type { FileRecord } from "@/api/files";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import FilePickerDialog from "./FilePickerDialog";

export interface AttachmentItem {
  id: number;
  filename: string;
  fileSize?: number;
  url?: string;
  indexed?: boolean;
  deletable?: boolean;
}

interface AttachmentManagerProps {
  readonly attachments: AttachmentItem[];
  readonly onSelect: (file: FileRecord) => Promise<void>;
  readonly onDelete: (id: number) => Promise<void>;
}

const AttachmentManager = ({
  attachments,
  onSelect,
  onDelete,
}: AttachmentManagerProps) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async (files: FileRecord[]) => {
    if (files.length === 0) return;
    setSelecting(true);
    try {
      await onSelect(files[0]);
    } finally {
      setSelecting(false);
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
            disabled={selecting}
          >
            <UploadIcon className="size-3.5" />
            {selecting
              ? t("common.uploading")
              : t("common.upload")}
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
                  onClick={() => void onDelete(a.id)}
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
        multiple={false}
      />
    </div>
  );
};

export default AttachmentManager;
