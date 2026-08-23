"use client";

import { createContext, useContext, type ReactNode } from "react";

const PaletteContext = createContext<string[]>([]);

export function PaletteProvider({ children, palette }: { children: ReactNode; palette: string[] }) {
  return <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;
}

export function useZinePalette() {
  return useContext(PaletteContext);
}
