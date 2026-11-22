import type { Metadata } from "next";
import { ContactView } from "@/views/contact";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Contact", description: seoDescriptions.contact, path: "/contact" });
export default function Page() { return <ContactView />; }
