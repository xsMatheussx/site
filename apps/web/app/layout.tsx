import type { Metadata } from "next";
import "./globals.css";

import "./tz-design-system.css";
import "./tz-experience.css";
import "./tz-premium-v7.css";
import "./tz-final-polish.css";
export const metadata: Metadata = {
  title: "TZ Store",
  description: "Venda, descubra e acesse produtos digitais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
