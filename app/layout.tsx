import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kulem Reservation Funnel",
  description: "Kule Sapanca için keşif, müsaitlik ve WhatsApp kapanış akışı."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
