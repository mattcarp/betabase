import { cn } from "../../lib/utils";
import type { Experimental_GeneratedImage } from "ai";

export type ImageProps = Partial<Experimental_GeneratedImage> & {
  className?: string;
  alt?: string;
  src?: string;
};

export const Image = ({ base64, uint8Array, mediaType, src, ...props }: ImageProps) => {
  const imageSrc = src || (base64 && mediaType ? `data:${mediaType};base64,${base64}` : "");
  
  if (!imageSrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={imageSrc}
      alt={props.alt || "AI generated image"}
      className={cn("max-w-full h-auto rounded-md overflow-hidden", props.className)}
    />
  );
};
