import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { GoodPicture } from "@/api/goods";
import { getGoodById } from "@/api/goods";
import { uploadGoodPicture, deleteGoodPicture } from "@/api/goodPictures";
import { Button } from "@/components/ui/button";

interface PictureManagerProps {
  readonly goodId: number;
}

const PictureManager = ({ goodId }: PictureManagerProps) => {
  const { t } = useTranslation();
  const [pictures, setPictures] = useState<GoodPicture[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPictures = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGoodById(goodId);
      setPictures(data.pictures);
    } finally {
      setLoading(false);
    }
  }, [goodId]);

  useEffect(() => {
    void fetchPictures();
  }, [fetchPictures]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      await Promise.all(Array.from(files).map((file) => uploadGoodPicture(goodId, file)));
      void fetchPictures();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (pictureId: number) => {
    await deleteGoodPicture(goodId, pictureId);
    void fetchPictures();
  };

  return (
    <div className="grid gap-3 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("goods.pictures.title")}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <PlusIcon className="size-3.5" />
          {uploading
            ? t("goods.pictures.uploading")
            : t("goods.pictures.upload")}
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
      {loading && (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      )}
      {!loading && pictures.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("goods.pictures.empty")}
        </p>
      )}
      {!loading && pictures.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pictures.map((pic) => (
            <div key={pic.id} className="group relative">
              <img
                src={pic.url}
                alt={pic.filename}
                className="size-20 rounded-md object-cover ring-1 ring-foreground/10"
              />
              <Button
                variant="destructive"
                size="icon-xs"
                className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleDelete(pic.id)}
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

export default PictureManager;
