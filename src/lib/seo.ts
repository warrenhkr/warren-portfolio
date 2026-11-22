import type { Metadata } from "next";
import { site } from "@/content/site";

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: site.name };

/**
 * Métadonnées d'une page intérieure.
 * Next remplace l'objet `openGraph` du layout dès qu'une page en définit un :
 * ce helper garantit que siteName, locale, type et image de partage ne disparaissent pas.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogImage = true,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "fr_FR",
      alternateLocale: ["en_US"],
      title,
      description,
      url: path,
      ...(ogImage ? { images: [OG_IMAGE] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [OG_IMAGE.url] } : {}),
    },
  };
}
