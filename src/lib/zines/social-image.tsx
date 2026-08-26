import { ImageResponse } from "next/og";

import type { ZinePalette } from "@/db/schema";

const defaultPalette: ZinePalette = [
  "#111111",
  "#ffffff",
  "#ef2d32",
  "#2455ff",
  "#f5e9d4",
];

type SocialImageOptions = {
  eyebrow: string;
  title: string;
  subtitle: string;
  palette?: ZinePalette;
};

const socialImageSize = { width: 1200, height: 630 };

export function createSocialImage({
  eyebrow,
  title,
  subtitle,
  palette = defaultPalette,
}: SocialImageOptions) {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: palette[4],
        color: palette[0],
        display: "flex",
        fontFamily: "Arial, Helvetica, sans-serif",
        height: "100%",
        padding: 54,
        width: "100%",
      }}
    >
      <div
        style={{
          background: palette[1],
          border: `6px solid ${palette[0]}`,
          boxShadow: `18px 18px 0 ${palette[2]}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "48px 56px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 5 }}>
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 900, lineHeight: 0.95 }}>
            {title}
          </div>
          <div style={{ color: palette[3], display: "flex", fontSize: 31, fontWeight: 800 }}>
            {subtitle}
          </div>
        </div>
      </div>
    </div>,
    socialImageSize,
  );
}
