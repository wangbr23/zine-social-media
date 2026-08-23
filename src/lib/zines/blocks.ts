import type { ImageBlock, TextBlock } from "@/db/schema";

export function createTextBlock(): TextBlock {
  return {
    id: crypto.randomUUID(),
    type: "text",
    x: 10,
    y: 10,
    width: 80,
    height: 20,
    rotation: 0,
    text: "Write something worth keeping.",
    fontFamily: "Georgia",
    fontSize: 28,
    color: "#111111",
    textAlign: "left",
  };
}

export function createImageBlock({ alt, url }: { alt: string; url: string }): ImageBlock {
  return {
    id: crypto.randomUUID(),
    type: "image",
    x: 10,
    y: 10,
    width: 80,
    height: 50,
    rotation: 0,
    url,
    alt,
    objectFit: "cover",
  };
}
