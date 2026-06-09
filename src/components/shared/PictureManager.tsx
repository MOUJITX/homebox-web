import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, PlusIcon, TrashIcon } from "lucide-react";
import type { FileRecord } from "@/api/files";
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import FilePickerDialog from "./FilePickerDialog";

export interface PictureItem {
  id: number;
  fileId: number;
  url: string;
  filename: string;
}

interface PictureManagerProps {
  readonly pictures: PictureItem[];
  readonly onSelect: (files: FileRecord[]) => Promise<void>;
  readonly onDeselect?: (files: FileRecord[]) => Promise<void>;
  readonly onDelete: (id: number) => Promise<void>;
  readonly isLoading?: boolean;
}

const PictureManager = ({
  pictures,
  onSelect,
  onDeselect,
  onDelete,
  isLoading,
}: PictureManagerProps) => {
  const { t } = useTranslation();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async (files: FileRecord[]) => {
    setSelecting(true);
    try {
      await onSelect(files);
    } finally {
      setSelecting(false);
    }
  };

  const handleDeselect = async (files: FileRecord[]) => {
    if (!onDeselect) return;
    setSelecting(true);
    try {
      await onDeselect(files);
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <ImageIcon className="size-4" />
          {t("common.pictures")}
        </h4>
        <Button
          variant="outline"
          size="sm"
          disabled={selecting}
          onClick={() => setPickerOpen(true)}
        >
          <PlusIcon className="size-3.5" />
          {selecting ? t("common.uploading") : t("common.upload")}
        </Button>
      </div>
      {isLoading && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("common.uploading").replace(/…$/, "")}...
          </p>
        </div>
      )}
      {!isLoading && pictures.length === 0 && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("common.noPictures")}
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
      <FilePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        onDeselect={handleDeselect}
        multiple
        accept="image/*"
        initialSelection={pictures.map((p) => ({
          id: p.fileId,
          storedFilename: "",
          originalFilename: p.filename,
          contentType: "image/*",
          fileSize: 0,
          url: p.url,
          createdAt: "",
          extractStatus: "SUCCESS" as const,
          chunkStatus: "SUCCESS" as const,
        }))}
      />
    </div>
  );
};

export default PictureManager;
