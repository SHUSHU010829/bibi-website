import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import "fumadocs-ui/style.css";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "逼逼機器人 BIBIBOT — 在 Discord 裡，迎接戲劇人生",
    template: "%s · 逼逼機器人 BIBIBOT",
  },
  description:
    "挖礦、賭場、樂透、股市、抽卡——一支機器人把經濟系統和一堆小遊戲全部串起來。專為 SHUSHU 的伺服器打造，每天都有事可做（而且，呃，有點難戒）。",
  applicationName: "逼逼機器人 BIBIBOT",
  keywords: ["逼逼機器人", "BIBIBOT", "Discord 機器人", "挖礦", "賭場", "樂透", "股市", "SHUSHU"],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "逼逼機器人 BIBIBOT",
    title: "逼逼機器人 BIBIBOT — 在 Discord 裡，迎接戲劇人生",
    description: "挖礦、賭場、樂透、股市、等級——一支機器人，把你的肝變現。有點難戒，先說好。",
  },
  twitter: {
    card: "summary_large_image",
    title: "逼逼機器人 BIBIBOT — 在 Discord 裡，迎接戲劇人生",
    description: "挖礦、賭場、樂透、股市、等級——一支機器人，把你的肝變現。有點難戒，先說好。",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
