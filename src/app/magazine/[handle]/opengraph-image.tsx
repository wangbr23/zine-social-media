import { notFound } from "next/navigation";

import { findProfileByHandle } from "@/lib/profile/queries";
import { createSocialImage } from "@/lib/zines/social-image";

export const alt = "Magazine profile on Zine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ProfileOpenGraphImageProps = {
  params: Promise<{ handle: string }>;
};

export default async function ProfileOpenGraphImage({
  params,
}: ProfileOpenGraphImageProps) {
  const { handle } = await params;
  const profile = await findProfileByHandle(handle);

  if (!profile) notFound();

  if (profile.visibility === "private") {
    return createSocialImage({
      eyebrow: "ZINE / MAGAZINE",
      title: "Private Magazine",
      subtitle: "Accepted followers only",
    });
  }

  return createSocialImage({
    eyebrow: "ZINE / MAGAZINE",
    title: profile.displayName,
    subtitle: `@${profile.handle}`,
  });
}
