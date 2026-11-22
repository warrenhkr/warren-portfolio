import type { Metadata } from "next";
import { HomeView } from "@/views/home";
import { seoDescriptions } from "@/content/copy";

export const metadata: Metadata = { title: { absolute: "WARREN HOUNKANRIN — Hardware & Software" }, description: seoDescriptions.home, alternates: { canonical: "/" } };
export default function Page() { return <HomeView />; }
