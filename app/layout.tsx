import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripPilot",
  description:
    "AI travel planning with Zoya",
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
