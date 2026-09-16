import type { Metadata } from "next";
import { Cutive_Mono, VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

const cutive = Cutive_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cutive-mono",
});

export const metadata: Metadata = {
  title: "Esther Ko — Tattoo · Writing · Mixed Media",
  description:
    "Portfolio and booking for Esther Ko (@3ndsofth33arth): black and gray tattoo, writing, and mixed media.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${vt323.variable} ${cutive.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
