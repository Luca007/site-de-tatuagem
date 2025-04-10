import "@/styles/globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Estúdio Arte em Pele - Tatuagens Profissionais",
  description: "Tenha a tatuagem perfeita feita por um artista profissional. Agende sua sessão hoje e dê vida às suas ideias através da arte.",
  keywords: "tatuagem, tattoo, estúdio de tatuagem, arte corporal, tatuador profissional, tatuagens personalizadas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        montserrat.variable,
        playfair.variable
      )}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
