import type { Metadata } from "next";
import "country-select-js/build/css/countrySelect.css";
import "./colors.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz API",
  description: "Quiz API Backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', overflow: 'hidden', margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
