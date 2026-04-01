import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | aesthetic",
    default: "aesthetic – Ästhetische Medizin in Österreich",
  },
  description:
    "Vergleichs- und Anfrageplattform für Schönheitschirurgie und ästhetische Medizin in Österreich. Finde qualifizierte Ärztinnen und Ärzte nach Behandlung und Ort.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://aesthetic.at"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
