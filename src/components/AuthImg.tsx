import { useAuthImage } from "@/hooks/useAuthImage";

const AuthImg = ({
  url,
  ...props
}: { url: string } & React.ImgHTMLAttributes<HTMLImageElement>) => {
  const src = useAuthImage(url);
  return src ? <img src={src} {...props} /> : null;
};

export default AuthImg;
