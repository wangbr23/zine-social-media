"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ZinePalette } from "@/db/schema";

const PaletteContext = createContext<ZinePalette | null>(null);

export function PaletteProvider({
  children,
  palette,
}: {
  children: ReactNode;
  palette: ZinePalette;
}) {
  return <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;
}

export function useZinePalette() {
  const palette = useContext(PaletteContext);
  if (!palette) {
    throw new Error("useZinePalette must be used within PaletteProvider");
  }
  return palette;
}
