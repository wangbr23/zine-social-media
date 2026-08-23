export const PAGE_IMAGE_CONTENT_TYPES = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PAGE_IMAGE_ACCEPT = PAGE_IMAGE_CONTENT_TYPES.join(",");
export const MAXIMUM_PAGE_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
