const AuthImg = ({
  url,
  ...props
}: { url: string } & React.ImgHTMLAttributes<HTMLImageElement>) =>
  url ? <img src={url} {...props} /> : null;

export default AuthImg;
