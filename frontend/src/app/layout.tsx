import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Radar de Mercado", template: "%s · Radar de Mercado" },
  description: "Tendências globais e oportunidades de negócio para o Brasil: edições de segunda a quarta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6">{children}</main>
        <footer className="border-t border-rule py-8 text-center text-sm text-ink-soft">
          Pesquisa gerada automaticamente: edições de segunda a quarta (1h, horário de Brasília). Confira as
          fontes antes de decidir.
        </footer>
      </body>
    </html>
  );
}
