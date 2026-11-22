"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import type { L } from "@/lib/types";
import { Icon } from "./Icon";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Encre « ember » pour le petit texte ──────────────────────── */
/* --ember (176 78 0) ne tient que 4,34:1 sur la bande claire (--band)
   et 3,7:1 sur une pastille ember/12 % : sous le seuil AA du texte
   normal. On garde la teinte, on descend d'un cran la valeur. */
export const EMBER_INK = "text-[rgb(150,66,0)] dark:text-[rgb(var(--ember))]";

/* ── Boutons ─────────────────────────────────────────────────── */
type BtnVariant = "primary" | "secondary" | "ghost" | "ember" | "signal";
export const btn = (v: BtnVariant = "primary", size: "sm" | "md" = "md") =>
  cn(
    // Pas de `focus-visible:outline-none` : il annulait l'anneau de focus global
    // (:focus-visible, 2 px ember) et rendait la cible invisible au clavier.
    "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-300 ease-out",
    size === "sm" ? "px-4 py-2 text-[13px]" : "px-6 py-3 text-sm",
    {
      primary: "bg-fg text-bg hover:-translate-y-0.5 hover:shadow-lift",
      secondary: "glass text-fg hover:-translate-y-0.5 hover:border-[rgb(var(--line)/0.22)]",
      ghost: "px-1 text-muted hover:text-fg",
      ember: "bg-ember text-bg shadow-ember hover:-translate-y-0.5",
      // En sombre --signal est clair (122 153 255) : du texte blanc n'y tient que
      // 2,68:1. L'encre passe en couleur de fond, soit 7,2:1.
      signal: "bg-signal text-white shadow-signal hover:-translate-y-0.5 dark:text-bg",
    }[v],
  );

/* ── Mise en page ────────────────────────────────────────────── */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-6 sm:px-8", className)}>{children}</div>;
}

export function Section({
  children,
  id,
  tone = "plain",
  className = "",
}: {
  children: ReactNode;
  id?: string;
  tone?: "plain" | "raise" | "ember" | "signal";
  className?: string;
}) {
  const bg = {
    plain: "",
    raise: "bg-[rgb(var(--band))]",
    ember: "bg-[linear-gradient(180deg,rgb(var(--ember)/0.10),transparent_70%)]",
    signal: "bg-[linear-gradient(180deg,rgb(var(--signal)/0.10),transparent_70%)]",
  }[tone];
  const glow = {
    plain: "rgb(var(--signal)/0.10)",
    raise: "rgb(var(--ember)/0.10)",
    ember: "rgb(var(--ember)/0.16)",
    signal: "rgb(var(--signal)/0.16)",
  }[tone];
  return (
    <section id={id} className={cn("relative isolate py-20 sm:py-28", bg, className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[min(1100px,90%)] -translate-x-1/2 rounded-full blur-[70px]"
        style={{ background: `radial-gradient(closest-side, ${glow}, transparent 72%)` }}
      />
      <Container>{children}</Container>
    </section>
  );
}

/* ── En-têtes de section : jamais comprimés ──────────────────── */
export function Eyebrow({ children, tone = "ember" }: { children: ReactNode; tone?: "ember" | "signal" | "muted" }) {
  const c = { ember: EMBER_INK, signal: "text-signal", muted: "text-muted" }[tone];
  return (
    <p className={cn("mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]", c)}>
      <span aria-hidden="true" className="h-px w-7 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  text,
  href,
  cta,
  align = "between",
  tone = "ember",
}: {
  eyebrow: L;
  title: L;
  text?: L;
  href?: string;
  cta?: L;
  align?: "between" | "stack";
  tone?: "ember" | "signal" | "muted";
}) {
  const { tr } = useLang();
  return (
    <div
      className={cn(
        "mb-12 gap-6",
        align === "between"
          ? "flex flex-col items-start sm:flex-row sm:items-end sm:justify-between"
          : "max-w-2xl",
      )}
    >
      <div className="max-w-2xl">
        <Eyebrow tone={tone}>{tr(eyebrow)}</Eyebrow>
        <h2 className="display text-3xl font-bold leading-[1.08] sm:text-[2.75rem]">{tr(title)}</h2>
        {text && <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">{tr(text)}</p>}
      </div>
      {href && cta && (
        <Link href={href} className={cn(btn("ghost"), "shrink-0 whitespace-nowrap text-sm")}>
          {tr(cta)}
          <Icon name="arrow" className="size-4 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

/* ── Carte de verre avec halo suiveur ────────────────────────── */
type Tone = "ember" | "signal" | "neutral" | "hardware" | "software";
const toneOf = (t: Tone) => (t === "hardware" ? "ember" : t === "software" ? "signal" : t);

export function GlassCard({
  children,
  className = "",
  tone = "ember",
  hover = true,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  hover?: boolean;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: RPointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "glass spot relative isolate rounded-3xl",
        toneOf(tone) === "signal" && "spot-signal",
        hover && "lift hover:border-[rgb(var(--line)/0.2)]",
        className,
      )}
    >
      <span aria-hidden="true" className="spot-glow" />
      {children}
    </Tag>
  );
}

/* ── Pastilles ───────────────────────────────────────────────── */
export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "ember" | "signal" | "neutral" | "glass";
  className?: string;
}) {
  const t = {
    ember: cn("border-[rgb(var(--ember)/0.35)] bg-[rgb(var(--ember)/0.12)]", EMBER_INK),
    signal: "border-[rgb(var(--signal)/0.35)] bg-[rgb(var(--signal)/0.12)] text-signal",
    neutral: "border-[rgb(var(--line)/0.14)] bg-[rgb(var(--line)/0.04)] text-muted",
    glass: "glass-quiet text-fg",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium leading-none",
        t,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function IconTile({
  name,
  tone = "ember",
  className = "",
}: {
  name: string;
  tone?: Tone;
  className?: string;
}) {
  const t = {
    ember: "border-[rgb(var(--ember)/0.28)] bg-[rgb(var(--ember)/0.12)] text-ember",
    signal: "border-[rgb(var(--signal)/0.28)] bg-[rgb(var(--signal)/0.12)] text-signal",
    neutral: "border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.05)] text-fg",
  }[toneOf(tone)];
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl border", t, className)}>
      <Icon name={name} className="size-5" />
    </span>
  );
}

/* ── Emplacement réservé (contenu que seul Warren peut fournir) ─ */
export function Slot({
  children,
  label,
  className = "",
}: {
  children?: ReactNode;
  label?: string;
  className?: string;
}) {
  const { tr } = useLang();
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] bg-[rgb(var(--line)/0.03)] p-5",
        className,
      )}
    >
      <p className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon name="plus" className="size-3" />
        {label ?? tr(copy.common.todo)}
      </p>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/* ── Révélation au défilement ────────────────────────────────── */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    // Filet de sécurité : si l'élément est déjà dans la fenêtre (ancre, rechargement, IO indisponible),
    // on l'affiche tout de suite — un contenu ne doit jamais rester invisible.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.98 && r.bottom > 0) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn("reveal", shown && "in", className)}>
      {children}
    </div>
  );
}

/* ── En-tête de page intérieure ──────────────────────────────── */
export function PageHero({
  eyebrow,
  title,
  text,
  current,
  meta,
}: {
  eyebrow: L;
  title: L;
  text: L;
  current: L;
  meta?: { label: L; value: string }[];
}) {
  const { tr } = useLang();
  return (
    <section className="relative overflow-hidden pb-8 pt-28 sm:pt-36">
      <Container>
        <nav aria-label={tr(copy.common.breadcrumb)} className="mb-10 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <Link href="/" className="transition hover:text-fg">
            {tr(copy.common.home)}
          </Link>
          <span aria-hidden="true" className="text-ember">
            /
          </span>
          <span aria-current="page" className="text-fg">
            {tr(current)}
          </span>
        </nav>

        <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Eyebrow>{tr(eyebrow)}</Eyebrow>
            <h1 className="display text-[2.6rem] font-bold leading-[0.98] sm:text-6xl lg:text-7xl">{tr(title)}</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">{tr(text)}</p>
          </div>

          {meta && meta.length > 0 && (
            <dl className="glass grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-1">
              {meta.map((m) => (
                <div key={m.value} className="flex items-baseline justify-between gap-4 px-5 py-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{tr(m.label)}</dt>
                  <dd className="font-heading text-lg font-semibold tabular-nums">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Container>
    </section>
  );
}

/* ── Bandeau défilant discret (logos, mots-clés) ─────────────── */
export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-3">
        {children}
        {children}
      </div>
    </div>
  );
}
