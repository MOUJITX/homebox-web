import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type ImagePreviewProps = {
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ImagePreview = ({ url, open, onOpenChange }: ImagePreviewProps) => {
  const slides = url ? [{ src: url }] : [];

  return (
    <Lightbox
      open={open}
      close={() => onOpenChange(false)}
      slides={slides}
      plugins={[Zoom]}
      styles={{ container: { backgroundColor: "rgba(0,0,0,0.75)" } }}
    />
  );
};

export default ImagePreview;
