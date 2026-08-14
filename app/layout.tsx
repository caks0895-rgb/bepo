import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEPO — Reality Gap Signal API",
  description: "Pay-per-call Reality Gap analysis for Base tokens. Powered by x402.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
