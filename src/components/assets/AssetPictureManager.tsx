import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, TrashIcon } from "lucide-react";
import { uploadAssetPicture, deleteAssetPicture } from "@/api/assetPictures";
import { useAssetDetail } from "@/hooks/queries/useAssetDetail";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
import AuthImg from "@/components/AuthImg";
import { Button } from "@/components/ui/button";

interface AssetPictureManagerProps {
  readonly assetId: number;
}

const AssetPictureManager = ({ assetId }: AssetPictureManagerProps) => {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useAssetDetail(assetId);
  const invalidate = useInvalidateAssets();
  const [uploading, setUploading] = useState(false);
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
    <div className="grid gap-3 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {t("assets.pictures.title")}
        </span>
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
        <p className="text-sm text-muted-foreground">
          {t("assets.pictures.empty")}
        </p>
      )}
      {!isLoading && pictures.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pictures.map((pic) => (
            <div key={pic.id} className="group relative">
              <AuthImg
                url={pic.url}
                alt={pic.filename}
                className="size-20 rounded-md object-cover ring-1 ring-foreground/10"
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
    </div>
  );
};

export default AssetPictureManager;
