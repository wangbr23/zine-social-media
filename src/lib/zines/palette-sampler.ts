import { PALETTE_SIZE } from "@/lib/zines/palettes";

type Bucket = { count: number; red: number; green: number; blue: number };

const channel = (value: number) => value.toString(16).padStart(2, "0");

/** Samples a small browser canvas and returns frequent, visibly distinct colors. */
export async function sampleImagePalette(file: File): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable");

  context.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();
  const pixels = context.getImageData(0, 0, size, size).data;
  const buckets = new Map<string, Bucket>();

  for (let index = 0; index < pixels.length; index += 16) {
    if (pixels[index + 3] < 160) continue;
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const key = `${red >> 5}-${green >> 5}-${blue >> 5}`;
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  const candidates = [...buckets.values()]
    .sort((left, right) => right.count - left.count)
    .map((item) => [
      Math.round(item.red / item.count),
      Math.round(item.green / item.count),
      Math.round(item.blue / item.count),
    ] as const);
  const chosen: (readonly [number, number, number])[] = [];

  for (const color of candidates) {
    const distinct = chosen.every((existing) =>
      Math.hypot(
        color[0] - existing[0],
        color[1] - existing[1],
        color[2] - existing[2],
      ) >= 52,
    );
    if (distinct || candidates.length <= PALETTE_SIZE) chosen.push(color);
    if (chosen.length === PALETTE_SIZE) break;
  }

  for (const color of candidates) {
    if (chosen.length === PALETTE_SIZE) break;
    if (!chosen.includes(color)) chosen.push(color);
  }

  return chosen.map(([red, green, blue]) => `#${channel(red)}${channel(green)}${channel(blue)}`);
}
