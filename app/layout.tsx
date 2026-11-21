import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { FestivalTools } from "@/components/festival-tools";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ganesh Utsav 2027 | Suryodaya Colony",
    template: "%s | Ganesh Utsav 2027",
  },
  description:
    "Join Suryodaya Colony in Hyderabad for Ganesh Utsav 2027 — a celebration of devotion, culture, and community. Explore the programme, volunteer, and celebrate with us.",
  applicationName: "Ganesh Utsav 2027",
  keywords: [
    "Ganesh Utsav 2027",
    "Ganesh Chaturthi Hyderabad",
    "Suryodaya Colony Ganesh Utsav",
    "Ganesh festival schedule",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Ganesh Utsav 2027",
    title: "Ganesh Utsav 2027 | Suryodaya Colony",
    description:
      "Celebrating faith, culture, and community in Suryodaya Colony, Hyderabad. Join the Ganesh Utsav from September 14 to 23, 2027.",
    images: [{ url: "/images/Ganesha%20beneath%20golden%20temple%20bells.png", width: 1200, height: 675, alt: "Lord Ganesha beneath golden temple bells" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ganesh Utsav 2027 | Suryodaya Colony",
    description: "Celebrating Faith, Culture & Community.",
    images: ["/images/Ganesha%20beneath%20golden%20temple%20bells.png"],
  },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#4b1714",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body suppressHydrationWarning>{children}<FestivalTools /></body>
    </html>
  );
}
