import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family World Cup Bracket",
  description: "A private family bracket for the 2026 World Cup."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
