import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HAKAN AKIN ZEYTİN ALIMI",
  description: "HAKAN AKIN ZEYTİN ALIMI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
