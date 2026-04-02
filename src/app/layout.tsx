import type { Metadata } from "next";
import "@/styles/globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
