import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter, Space_Grotesk, Syne } from "next/font/google";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/app/providers/app-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

/** Hub home (`.mb-root`) — body text + display headings; rest of app stays Inter. */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-hub-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-hub-display",
  display: "swap",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Orakly Market — Trade conviction",
  description:
    "Premium prediction market liquidity — crypto, macro, memes, and realtime odds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          spaceGrotesk.variable,
          syne.variable,
          "min-h-screen bg-background text-foreground antialiased",
        )}
        suppressHydrationWarning
      >
        {/*
          Client providers (Theme + Web3 + React Query + RainbowKit) live in AppProviders.
          next-themes drives the .dark/.light class on <html>; suppressHydrationWarning
          avoids noise when wagmi restores a persisted wallet connection and when
          next-themes resolves the theme on first paint.
        */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
