import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {Room} from "@/app/Room";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Figma Clone",
  description: "A minimalist Figma clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Room>

      {children}

      </Room>
      </body>
    </html>
  );
}
