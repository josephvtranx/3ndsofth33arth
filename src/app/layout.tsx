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

const title = "Esther Ko — Tattoo · Writing · Mixed Media";
const description =
  "Portfolio and booking for Esther Ko (@3ndsofth33arth): black and gray tattoo, writing, and mixed media.";
const shareImage = {
  url: "/share-preview.png",
  width: 1716,
  height: 966,
  alt: "Esther Ko — tattoo, writing, and mixed media, on a white background with soft halftone dots",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://3ndsofth33arth.com"),
  title,
  description,
  openGraph: {
    type: "website",
    siteName: "3ndsofth33arth",
    title,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
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
