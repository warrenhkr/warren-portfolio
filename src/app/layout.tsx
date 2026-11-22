import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource-variable/inter";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";
import { site } from "@/content/site";
import { seoDescriptions } from "@/content/copy";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Hardware & Software`, template: `%s | ${site.name}` },
  description: seoDescriptions.home,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    title: `${site.name} — Hardware & Software`,
    description: seoDescriptions.home,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
    { media: "(prefers-color-scheme: light)", color: "#F4F0E9" },
  ],
};

/** Données structurées : identité uniquement, aucune expérience inventée. */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  description: seoDescriptions.home,
  knowsAbout: ["Électronique embarquée", "IoT", "Robotique", "Développement logiciel"],
  ...(site.email ? { email: `mailto:${site.email}` } : {}),
  ...(site.socials.some((s) => s.url) ? { sameAs: site.socials.filter((s) => s.url).map((s) => s.url) } : {}),
};

/** Layout racine volontairement neutre : le site public et l'ADMIN ont chacun leur propre habillage (groupes de routes). */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        <noscript>
          <style>{`.reveal,.hero-reveal{opacity:1!important;transform:none!important;filter:none!important}.intro-overlay{display:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
