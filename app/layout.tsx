import type { Metadata } from "next";
import "./globals.css";
import {
  ColorSchemeScript,
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from "@mantine/core";
import "@mantine/core/styles.css";
export const metadata: Metadata = {
  title: "HAKAN AKIN ZEYTİN ALIMI",
  description: "HAKAN AKIN ZEYTİN ALIMI",
};
const primaryColor: MantineColorsTuple = [
  "#ebf9ff",
  "#d6f0fb",
  "#a8e1f8",
  "#79d1f7",
  "#5ac4f5",
  "#4bbbf5",
  "#41b8f6",
  "#35a1dc",
  "#278fc5",
  "#007cad",
];
const secondaryColor: MantineColorsTuple = [
  "#fcf9e9",
  "#f6f0d9",
  "#ebe0b2",
  "#dfce88",
  "#d6c064",
  "#d0b64d",
  "#cdb240",
  "#b59c31",
  "#a18a28",
  "#8b771b",
];
const theme = createTheme({
  fontFamily: "Open Sans, sans-serif",
  colors: {
    primary: primaryColor,
    secondary: secondaryColor,
  },
  cursorType: "pointer",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <header className="h-20 bg-gray-50 flex flex-row justify-center text-center">
          <p className="text-2xl lg:text-7xl">HAKAN AKIN ZEYTİN ALIM</p>
        </header>
        <MantineProvider forceColorScheme="light" theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
