import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, PlusIcon, TrashIcon } from "lucide-react";
import { uploadAssetPicture, deleteAssetPicture } from "@/api/assetPictures";
import { useAssetDetail } from "@/hooks/queries/useAssetDetail";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";

interface AssetPictureManagerProps {
  readonly assetId: number;
}

const AssetPictureManager = ({ assetId }: AssetPictureManagerProps) => {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useAssetDetail(assetId);
  const invalidate = useInvalidateAssets();
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pictures = detail?.pictures ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      await Promise.all(
        Array.from(files).map((file) => uploadAssetPicture(assetId, file)),
      );
      void invalidate.invalidateDetail(assetId);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (pictureId: number) => {
    await deleteAssetPicture(assetId, pictureId);
    void invalidate.invalidateDetail(assetId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        {" "}
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <ImageIcon className="size-4" />
          {t("assets.pictures.title")}
        </h4>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <PlusIcon className="size-3.5" />
          {uploading
            ? t("assets.pictures.uploading")
            : t("assets.pictures.upload")}
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
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      )}
      {!isLoading && pictures.length === 0 && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("assets.pictures.empty")}
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
                className="size-20 rounded-md object-cover ring-1 ring-foreground/10 cursor-pointer"
                onClick={() => setPreviewIndex(idx)}
              />
              <Button
                variant="destructive"
                size="icon-xs"
                className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => void handleDelete(pic.id)}
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

export default AssetPictureManager;
