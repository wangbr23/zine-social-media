import { put } from "@vercel/blob/client";

import {
  MAXIMUM_PAGE_IMAGE_SIZE_BYTES,
  PAGE_IMAGE_ACCEPT,
  PAGE_IMAGE_CONTENT_TYPES,
} from "./page-image-policy";

export { PAGE_IMAGE_ACCEPT };

export type PageImageUploadErrorCode =
  | "invalid_type"
  | "too_large"
  | "unauthorized"
  | "unavailable"
  | "network"
  | "upload_failed";

export class PageImageUploadError extends Error {
  constructor(public readonly code: PageImageUploadErrorCode) {
    super(code);
    this.name = "PageImageUploadError";
  }
}

function isNetworkError(error: unknown) {
  return error instanceof TypeError ||
    (error instanceof Error && /fetch|network|connection/i.test(error.message));
}

/** Uploads a page image through the client-upload route and returns its blob URL. */
export async function uploadPageImage({
  clerkUserId,
  file,
}: {
  clerkUserId: string;
  file: File;
}) {
  if (!PAGE_IMAGE_CONTENT_TYPES.some((type) => type === file.type)) {
    throw new PageImageUploadError("invalid_type");
  }
  if (file.size > MAXIMUM_PAGE_IMAGE_SIZE_BYTES) {
    throw new PageImageUploadError("too_large");
  }

  const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
  const pathname = `zine-pages/${clerkUserId}/${name}`;

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("/api/zine-page-images/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname, clientPayload: null, multipart: false },
      }),
    });
  } catch (error) {
    throw new PageImageUploadError(isNetworkError(error) ? "network" : "unavailable");
  }

  if (tokenResponse.status === 401) throw new PageImageUploadError("unauthorized");
  if (!tokenResponse.ok) throw new PageImageUploadError("unavailable");

  const tokenBody = (await tokenResponse.json().catch(() => null)) as
    | { clientToken?: unknown }
    | null;
  if (typeof tokenBody?.clientToken !== "string") {
    throw new PageImageUploadError("unavailable");
  }

  let blob;
  try {
    blob = await put(pathname, file, {
      access: "public",
      token: tokenBody.clientToken,
    });
  } catch (error) {
    throw new PageImageUploadError(isNetworkError(error) ? "network" : "upload_failed");
  }

  return blob.url;
}

export function imageAltFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}
