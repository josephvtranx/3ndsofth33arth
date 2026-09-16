import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3ndsofth33arth",
  description: "A creative portfolio and tattoo-booking experience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
