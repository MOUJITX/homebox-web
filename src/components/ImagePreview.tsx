import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type Slide = { src: string };

type ImagePreviewProps = {
  url?: string | null;
  slides?: Slide[];
  index?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ImagePreview = ({
  url,
  slides: slidesProp,
  index = 0,
  open,
  onOpenChange,
}: ImagePreviewProps) => {
  const slides = slidesProp ?? (url ? [{ src: url }] : []);
  const isSingle = slides.length <= 1;

  return (
    <Lightbox
      open={open}
      close={() => onOpenChange(false)}
      slides={slides}
      index={index}
      plugins={[Zoom]}
      controller={{ closeOnBackdropClick: true }}
      styles={{
        container: { backgroundColor: "rgba(0,0,0,0.75)" },
        ...(isSingle
          ? {
              navigationPrev: { display: "none" },
              navigationNext: { display: "none" },
            }
          : {}),
      }}
    />
  );
};

export default ImagePreview;
