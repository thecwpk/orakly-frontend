import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter, Inter_Tight, Space_Grotesk, Syne } from "next/font/google";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/app/providers/app-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orakly-frontend-web.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orakly Market: on-chain prediction markets",
    template: "%s · Orakly Market",
  },
  description:
    "Trade which crypto narrative wins next. Odds on AI agents, L2s, memecoins, DeFi, and restaking rotations.",
  applicationName: "Orakly Market",
  keywords: [
    "prediction markets",
    "crypto narratives",
    "on-chain",
    "attention markets",
    "DeFi",
    "Orakly",
  ],
  alternates: { canonical: "/dapp" },
  openGraph: {
    type: "website",
    url: "/dapp",
    siteName: "Orakly Market",
    title: "Orakly: trade crypto narrative attention",
    description:
      "Trade which crypto narrative wins next. Odds on AI agents, L2s, memecoins, DeFi, and restaking.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orakly: crypto narrative markets",
    description: "Trade which crypto narrative wins next.",
    creator: "@orakly",
  },
  robots: { index: true, follow: true },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={cn("dark font-sans", inter.variable, interTight.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          spaceGrotesk.variable,
          syne.variable,
          interTight.variable,
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
