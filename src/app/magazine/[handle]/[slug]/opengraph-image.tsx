import { notFound } from "next/navigation";

import { findProfileByHandle } from "@/lib/profile/queries";
import { getPublishedZineForReader } from "@/lib/zines/reader";
import { createSocialImage } from "@/lib/zines/social-image";

export const alt = "Published issue on Zine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ZineOpenGraphImageProps = {
  params: Promise<{ handle: string; slug: string }>;
};

export default async function ZineOpenGraphImage({
  params,
}: ZineOpenGraphImageProps) {
  const { handle, slug } = await params;
  const profile = await findProfileByHandle(handle);

  if (!profile) notFound();

  if (profile.visibility === "private") {
    return createSocialImage({
      eyebrow: "ZINE / PUBLISHED ISSUE",
      title: "Private Issue",
      subtitle: "Accepted followers only",
    });
  }

  const zine = await getPublishedZineForReader(profile.id, slug);
  if (!zine) notFound();

  return createSocialImage({
    eyebrow: "ZINE / PUBLISHED ISSUE",
    title: zine.title,
    subtitle: `By ${profile.displayName}`,
    palette: zine.palette,
  });
}
