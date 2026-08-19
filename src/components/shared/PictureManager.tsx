import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, PlusIcon, TrashIcon } from "lucide-react";
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { useFileSelectionSync } from "@/hooks/useFileSelectionSync";
import FilePickerDialog from "./FilePickerDialog";

export interface PictureItem {
  id: number;
  fileId: number;
  url: string;
  filename: string;
}

interface PictureManagerProps {
  readonly pictures: PictureItem[];
  readonly onSync: (fileIds: number[]) => Promise<void>;
  readonly isLoading?: boolean;
}

const PictureManager = ({
  pictures,
  onSync,
  isLoading,
}: PictureManagerProps) => {
  const { t } = useTranslation();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const currentFileIds = pictures.map((p) => p.fileId);

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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <ImageIcon className="size-4" />
          {t("common.pictures")}
        </h4>
        <Button
          variant="outline"
          size="sm"
          disabled={syncing}
          onClick={() => setPickerOpen(true)}
        >
          <PlusIcon className="size-3.5" />
          {syncing ? t("common.uploading") : t("common.upload")}
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
                onClick={() => void handleDelete(pic.fileId)}
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
