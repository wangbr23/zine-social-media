import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { findUserByClerkId } from "@/lib/auth/user";
import {
  MAXIMUM_PAGE_IMAGE_SIZE_BYTES,
  PAGE_IMAGE_CONTENT_TYPES,
} from "@/lib/zines/page-image-policy";

const CLIENT_TOKEN_LIFETIME_MS = 10 * 60 * 1000;
const SAFE_IMAGE_FILENAME =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}\.(?:avif|jpe?g|png|webp)$/i;

class UnauthorizedUploadError extends Error {}
class InvalidUploadPathError extends Error {}

function isAllowedPathname(pathname: string, userId: string) {
  const userPrefix = `zine-pages/${userId}/`;

  if (!pathname.startsWith(userPrefix)) {
    return false;
  }

  return SAFE_IMAGE_FILENAME.test(pathname.slice(userPrefix.length));
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();

        if (!userId) {
          throw new UnauthorizedUploadError();
        }

        const databaseUser = await findUserByClerkId(userId);

        if (!databaseUser) {
          throw new UnauthorizedUploadError();
        }

        if (!isAllowedPathname(pathname, userId)) {
          throw new InvalidUploadPathError(
            `Image pathname must match zine-pages/${userId}/<filename> and use an allowed image extension.`,
          );
        }

        return {
          allowedContentTypes: [...PAGE_IMAGE_CONTENT_TYPES],
          maximumSizeInBytes: MAXIMUM_PAGE_IMAGE_SIZE_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + CLIENT_TOKEN_LIFETIME_MS,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof UnauthorizedUploadError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (error instanceof InvalidUploadPathError) {
      return NextResponse.json({ error: "invalid_upload_path" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "upload_unavailable" },
      { status: 503 },
    );
  }
}
