import type { Metadata, Viewport } from "next";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orakly-frontend-web.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c1220" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orakly Market — YES/NO prediction markets, on-chain",
    template: "%s · Orakly Market",
  },
  description:
    "Trade live YES/NO odds on crypto, macro, sports, and tech. Transparent rules, stablecoin rails, and verifiable on-chain settlement.",
  applicationName: "Orakly Market",
  keywords: [
    "prediction markets",
    "on-chain",
    "crypto",
    "YES NO",
    "DeFi",
    "Orakly",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Orakly Market",
    title: "Orakly Market — YES/NO prediction markets, on-chain",
    description:
      "Trade live YES/NO odds on crypto, macro, sports, and tech. Transparent rules, stablecoin rails, and verifiable on-chain settlement.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orakly Market — YES/NO on-chain",
    description: "On-chain prediction markets. Trade live YES/NO odds.",
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
