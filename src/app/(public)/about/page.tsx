import type { Metadata } from "next";
import { AboutView } from "@/views/about";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "À propos", description: seoDescriptions.about, path: "/about" });
export default function Page() { return <AboutView />; }
