import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Social Autopilot",
  description: "Instagram-first content ops dashboard for restaurants and small businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

