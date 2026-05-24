import { useRef, useState } from "react";
import { UploadIcon, FileIcon, TrashIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";

export interface AttachmentItem {
  id: number;
  filename: string;
  fileSize: number;
  url?: string;
}

interface Props {
  attachments: AttachmentItem[];
  uploadLabel: string;
  emptyLabel: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const AttachmentManager = ({ attachments, uploadLabel, emptyLabel, onUpload, onDelete }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onUpload(file); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{uploadLabel}</h4>
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <UploadIcon className="size-3.5" />
            {uploading ? "..." : uploadLabel}
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 overflow-hidden rounded-lg border p-2">
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.filename}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(a.fileSize)}</p>
              </div>
              {a.url && (
                <a href={a.url} download={a.filename}>
                  <Button variant="ghost" size="icon-xs" type="button" title="Download">
                    <DownloadIcon className="size-3.5" />
                  </Button>
                </a>
              )}
              <Button variant="ghost" size="icon-xs" onClick={() => onDelete(a.id)} title="Delete">
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
