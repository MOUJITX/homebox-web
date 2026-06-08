import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, PlusIcon, TrashIcon } from "lucide-react";
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";

export interface PictureItem {
  id: number;
  url: string;
  filename: string;
}

interface PictureManagerProps {
  readonly pictures: PictureItem[];
  readonly onUpload: (files: File[]) => Promise<void>;
  readonly onDelete: (id: number) => Promise<void>;
  readonly isLoading?: boolean;
}

const PictureManager = ({
  pictures,
  onUpload,
  onDelete,
  isLoading,
}: PictureManagerProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      await onUpload(Array.from(files));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <ImageIcon className="size-4" />
          {t("shared.pictures.title")}
        </h4>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <PlusIcon className="size-3.5" />
          {uploading
            ? t("shared.pictures.uploading")
            : t("shared.pictures.upload")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      {isLoading && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("shared.pictures.uploading").replace(/…$/, "")}...
          </p>
        </div>
      )}
      {!isLoading && pictures.length === 0 && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("shared.pictures.empty")}
          </p>
        </div>
      )}
      {!isLoading && pictures.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pictures.map((pic, idx) => (
            <div key={pic.id} className="group relative">
              <AuthImg
                url={pic.url}
                alt={pic.filename}
                className="size-20 rounded-md object-cover border border-foreground/10 cursor-pointer"
                onClick={() => setPreviewIndex(idx)}
              />
              <Button
                variant="destructive"
                size="icon-xs"
                className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => void onDelete(pic.id)}
              >
                <TrashIcon className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <ImagePreview
        slides={pictures.map((p) => ({ src: p.url }))}
        index={previewIndex ?? 0}
        open={previewIndex != null}
        onOpenChange={(open) => !open && setPreviewIndex(null)}
      />
    </div>
  );
};

export default PictureManager;
