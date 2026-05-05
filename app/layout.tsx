import type { Metadata } from "next";
import { Bodoni_Moda, Manrope, DM_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saha·Event | Plateforme N°1 de Salles des Fêtes en Algérie",
  description:
    "Trouvez et réservez la salle des fêtes parfaite pour votre mariage en Algérie. Plus de 500 salles vérifiées à travers 48 wilayas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={cn(
          "min-h-screen antialiased",
          bodoni.variable,
          manrope.variable,
          dmMono.variable
        )}
      >
        <ToastProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
