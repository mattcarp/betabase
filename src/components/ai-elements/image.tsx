import { cn } from "../../lib/utils";
import type { Experimental_GeneratedImage } from "ai";

export type ImageProps = Experimental_GeneratedImage & {
  cclassName?: string;
  alt?: string;
};

export const Image = ({ base64, uint8Array, mediaType, ...props }: ImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    {...props}
    src={`data:${mediaType};base64,${base64}`}
    alt={props.alt || "AI generated image"}
    cclassName={cn("max-w-full h-auto rounded-md overflow-hidden", props.cclassName)}
  />
);
