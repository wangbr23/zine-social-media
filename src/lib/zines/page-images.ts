import { upload } from "@vercel/blob/client";

export const PAGE_IMAGE_ACCEPT = "image/avif,image/jpeg,image/png,image/webp";

/** Uploads a page image through the client-upload route and returns its blob URL. */
export async function uploadPageImage({
  clerkUserId,
  file,
}: {
  clerkUserId: string;
  file: File;
}) {
  const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
  const blob = await upload(`zine-pages/${clerkUserId}/${name}`, file, {
    access: "public",
    handleUploadUrl: "/api/zine-page-images/upload",
  });

  return blob.url;
}

export function imageAltFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}
