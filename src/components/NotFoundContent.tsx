"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { Container } from "@/components/ui";

/** Contenu bilingue de la 404 : composant client pour lire la langue choisie. */
export function NotFoundContent() {
  const { tr } = useLang();
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      <Container>
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ember">{tr(copy.notFound.eyebrow)}</p>
          <p className="display mt-6 bg-[linear-gradient(100deg,rgb(var(--ember)),rgb(var(--signal)))] bg-clip-text text-[26vw] font-bold leading-[0.8] text-transparent sm:text-[10rem]">
            404
          </p>
          <h1 className="display mt-6 text-2xl font-bold sm:text-3xl">{tr(copy.notFound.title)}</h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">{tr(copy.notFound.text)}</p>
          <Link
            href="/"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 text-sm font-semibold text-bg transition hover:-translate-y-0.5"
          >
            {tr(copy.common.backHome)}
          </Link>
        </div>
      </Container>
    </section>
  );
}
