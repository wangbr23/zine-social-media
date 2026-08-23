import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { findUserByClerkId } from "@/lib/auth/user";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAXIMUM_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
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
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAXIMUM_IMAGE_SIZE_BYTES,
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof InvalidUploadPathError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unable to authorize upload" },
      { status: 400 },
    );
  }
}
