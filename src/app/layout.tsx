import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zine",
  description: "Create, publish, and discover page-based zines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#2455ff",
          colorForeground: "#111111",
          colorBackground: "#ffffff",
          borderRadius: "0px",
          fontFamily: "Arial, Helvetica, sans-serif",
        },
        options: {
          elevation: "flush",
          socialButtonsPlacement: "bottom",
        },
      }}
    >
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
