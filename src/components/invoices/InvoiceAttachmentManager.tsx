import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadIcon, TrashIcon, FileIcon } from "lucide-react";
import type { InvoiceAttachment } from "@/api/invoices";
import {
  uploadInvoiceAttachment,
  deleteInvoiceAttachment,
} from "@/api/invoices";
import { downloadAuthFile } from "@/hooks/useAuthImage";
import { Button } from "@/components/ui/button";

interface InvoiceAttachmentManagerProps {
  readonly invoiceId: number;
  readonly attachments: InvoiceAttachment[];
  readonly onChanged: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const InvoiceAttachmentManager = ({
  invoiceId,
  attachments,
  onChanged,
}: InvoiceAttachmentManagerProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        await uploadInvoiceAttachment(invoiceId, file);
        onChanged();
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [invoiceId, onChanged],
  );

  const handleDelete = useCallback(
    async (attachmentId: number) => {
      await deleteInvoiceAttachment(invoiceId, attachmentId);
      onChanged();
    },
    [invoiceId, onChanged],
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {t("invoices.attachments.title")}
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
            ? t("invoices.attachments.uploading")
            : t("invoices.attachments.upload")}
        </Button>
      </div>
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("invoices.attachments.empty")}
        </p>
      ) : (
        <div className="grid gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 rounded-lg border p-2"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{att.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(att.fileSize)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() =>
                  downloadAuthFile(att.url, att.filename)
                }
              >
                <FileIcon className="size-3.5" />
              </Button>
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

export default InvoiceAttachmentManager;
