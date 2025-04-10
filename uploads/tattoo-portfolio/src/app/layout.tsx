import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { Raleway } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "Ink Master - Professional Tattoo Studio",
  description: "Get the perfect tattoo from a professional artist. Book your session today and bring your ideas to life through art.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable,
        raleway.variable
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
