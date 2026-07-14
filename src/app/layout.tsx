import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Amber Real Estate - บ้านดี คอนโดดี",
  description: "ค้นหาอสังหาริมทรัพย์ คอนโด บ้าน ทาวน์เฮาส์ ให้เช่า ขาย - Amber Real Estate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
