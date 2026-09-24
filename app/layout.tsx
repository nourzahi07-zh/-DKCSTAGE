import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
import { CABINET } from "@/lib/cabinet";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap" });

const description =
  "DKC — cabinet de kinésithérapie, massage et accompagnement des patients diabétiques à Fès. Prise de rendez-vous en ligne, au cabinet ou à domicile.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "DKC — Diabète Kiné Care | Kinésithérapie à Fès",
    template: "%s | DKC Fès",
  },
  description,
  applicationName: "DKC",
  openGraph: {
    type: "website",
    locale: "fr_MA",
    siteName: "DKC — Diabète Kiné Care",
    title: "DKC — Diabète Kiné Care | Kinésithérapie à Fès",
    description,
    url: "/",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0f6659",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift"
        >
          Aller au contenu principal
        </a>
        {children}
        <script
          type="application/ld+json"
          // Basic, factual business data only - no invented claims.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              name: `${CABINET.name} — ${CABINET.fullName}`,
              address: {
                "@type": "PostalAddress",
                streetAddress: "18 Rue Ibnou Rochd, V.N., Étage 1, Bureau 3",
                addressLocality: CABINET.city,
                postalCode: "30000",
                addressCountry: "MA",
              },
              url: getSiteUrl(),
            }),
          }}
        />
      </body>
    </html>
  );
}
