import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BoothProvider } from "@/lib/boothContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Take Your Time | Google Geometric Photobooth",
  description: "Click, Snap, and Shine! A Material-styled geometric photobooth for graduation snapshots, stickers, downloads, and prints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <BoothProvider>
          {children}
        </BoothProvider>
      </body>
    </html>
  );
}

