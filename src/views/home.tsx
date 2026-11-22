"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { domains } from "@/content/about";
import { projects } from "@/content/projects";
import { stack } from "@/content/stack";
import { aiTools } from "@/content/ai";
import { site } from "@/content/site";
import { cn, Container, Eyebrow, GlassCard, IconTile, Reveal, Section, SectionHead, Slot, btn } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { BrandLogo } from "@/components/Logo";
import { HeroArt } from "@/components/HeroArt";
import { HeroCinematic } from "@/components/HeroCinematic";
import { ProjectCard } from "@/components/ProjectCard";
import { WorldsBand } from "@/components/WorldsBand";

function Hero() {
  const { tr } = useLang();
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28 lg:pt-40">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.12fr_1fr] lg:gap-14 xl:gap-16">
          {/* ── Voix : l'index, le nom, une phrase, les domaines, un appel ── */}
          <div className="min-w-0">
            <div className="hero-reveal flex items-center gap-4" style={{ transitionDelay: "40ms" }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">{tr(copy.hero.index)}</span>
              <span aria-hidden="true" className="h-px w-16 bg-[rgb(var(--line)/0.16)] sm:w-24" />
            </div>

            <h1
              aria-label="WARREN HOUNKANRIN"
              className="hero-reveal mt-7 display text-[clamp(2.6rem,12vw,3.2rem)] font-bold leading-[0.9] sm:mt-8 sm:text-[clamp(3.2rem,8.4vw,4.1rem)] lg:text-[clamp(2.9rem,6.2vw,4.8rem)]"
              style={{ transitionDelay: "120ms" }}
            >
              <span className="block break-words">WARREN</span>
              <span className="block break-words bg-[linear-gradient(101deg,rgb(var(--ember))_0%,rgb(var(--ember))_62%,rgb(var(--signal))_100%)] bg-clip-text text-transparent">
                HOUNKANRIN
              </span>
            </h1>

            <p
              className="hero-reveal mt-7 max-w-[34ch] text-[17px] leading-[1.65] text-muted sm:mt-8 sm:text-[18px] lg:text-[19px]"
              style={{ transitionDelay: "220ms" }}
            >
              {tr(copy.hero.tagline)}
            </p>

            {/* Seule apparition des deux couleurs : une ligne de domaines, en légende */}
            <div
              className="hero-reveal mt-8 flex flex-col gap-2 font-mono text-[10.5px] leading-relaxed tracking-[0.02em] text-muted sm:mt-9 sm:text-[11px]"
              style={{ transitionDelay: "300ms" }}
            >
              {(["hardware", "software"] as const).map((cat) => (
                <p key={cat} className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 shrink-0 rounded-full", cat === "hardware" ? "bg-ember" : "bg-signal")}
                  />
                  <span className="uppercase tracking-[0.18em] text-fg/80">{tr(copy.common[cat])}</span>
                  {domains[cat].slice(0, 2).map((d) => (
                    <span key={d.fr} className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="text-muted/50">
                        ·
                      </span>
                      <span>{tr(d)}</span>
                    </span>
                  ))}
                </p>
              ))}
            </div>

            <div className="hero-reveal mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-10" style={{ transitionDelay: "380ms" }}>
              <Link href="/projects" className={btn("primary")}>
                {tr(copy.common.discover)}
                <Icon name="arrow" className="size-4 transition duration-300 group-hover:translate-x-1" />
              </Link>
              <Link href="/contact" className={cn(btn("ghost"), "!px-0 text-[13px] uppercase tracking-[0.14em]")}>
                {tr(copy.common.contactMe)}
                <Icon name="arrow" className="size-3.5 transition duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="hero-reveal mt-12 hidden items-center gap-3 lg:flex" style={{ transitionDelay: "460ms" }}>
              <span aria-hidden="true" className="relative h-11 w-px overflow-hidden bg-[rgb(var(--line)/0.14)]">
                <span className="absolute inset-x-0 top-0 h-3 animate-scrollDot bg-ember" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{tr(copy.common.scroll)}</span>
            </div>
          </div>

          {/* ── Instrument : aligné optiquement sur le bloc de texte ── */}
          <div
            className="hero-reveal w-full max-w-[540px] justify-self-center lg:justify-self-end"
            style={{ transitionDelay: "520ms" }}
          >
            <HeroArt />
          </div>
        </div>
      </Container>
    </section>
  );
}

export function HomeView() {
  const { tr } = useLang();
  const h = copy.home;

  return (
    <>
      <HeroCinematic />
      <Hero />

      {/* ── Bento profil ─────────────────────────────────────── */}
      <Section id="profil">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <Eyebrow>{tr(h.aboutEyebrow)}</Eyebrow>
            <h2 className="display max-w-xl text-3xl font-bold leading-[1.05] sm:text-[2.6rem]">{tr(h.aboutTitle)}</h2>
          </div>
          <Link href="/about" className={cn(btn("ghost"), "hidden shrink-0 sm:inline-flex")}>
            {tr(copy.common.seeMore)}
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <GlassCard className="h-full p-7 sm:p-8">
              <p className="text-[17px] leading-relaxed text-fg/90">{tr(h.aboutText)}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/about" className={btn("secondary", "sm")}>
                  {tr(copy.common.seeMore)}
                  <Icon name="arrow" className="size-3.5" />
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">warren_hkr</span>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={80} className="md:col-span-2">
            <GlassCard tone="neutral" className="flex h-full flex-col justify-between gap-6 p-6">
              <IconTile name="graduation" tone="neutral" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{tr(copy.common.education)}</p>
                <p className="mt-2 font-heading text-[15px] font-semibold leading-snug">{tr(copy.about.degree)}</p>
              </div>
            </GlassCard>
          </Reveal>

          {(["hardware", "software"] as const).map((cat, i) => (
            <Reveal key={cat} delay={120 + i * 80} className="md:col-span-3">
              <GlassCard tone={cat === "hardware" ? "ember" : "signal"} className="h-full p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconTile name={cat === "hardware" ? "cpu" : "code"} tone={cat === "hardware" ? "ember" : "signal"} />
                    <div>
                      <p className="font-heading text-base font-semibold">{tr(copy.common[cat])}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                        {cat === "hardware" ? tr(copy.home.hardwareTags) : tr(copy.home.softwareTags)}
                      </p>
                    </div>
                  </div>
                  <Icon name="arrow" className="size-4 text-muted" />
                </div>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {domains[cat].map((d) => (
                    <li key={d.fr} className="flex items-center gap-2 text-[13px] text-muted">
                      <span
                        aria-hidden="true"
                        className={cn("size-1 rounded-full", cat === "hardware" ? "bg-ember" : "bg-signal")}
                      />
                      {tr(d)}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Projets ──────────────────────────────────────────── */}
      <Section tone="raise">
        <SectionHead eyebrow={h.projectsEyebrow} title={h.projectsTitle} text={h.projectsText} href="/projects" cta={copy.common.allProjects} />
        <div className="grid gap-4 lg:grid-cols-3">
          {projects.slice(0, 1).map((p) => (
            <ProjectCard key={p.slug} p={p} featured />
          ))}
          <div className="flex flex-col gap-4">
            <Reveal delay={60} className="flex-1">
              <Slot className="flex h-full min-h-[180px] flex-col justify-end" label={tr(copy.projects.slotTitle)}>
                {tr(copy.projects.slotText)}
              </Slot>
            </Reveal>
            <Reveal delay={120}>
              <div className="glass-quiet flex flex-col justify-between gap-6 rounded-3xl p-6">
                <span className="grid size-10 place-items-center rounded-2xl border border-[rgb(var(--line)/0.12)] text-muted">
                  <Icon name="grid" className="size-5" />
                </span>
                <div>
                  <p className="font-heading text-base font-semibold">{tr(copy.common.allProjects)}</p>
                  <Link href="/projects" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-ember">
                    {tr(copy.projects.eyebrow)}
                    <Icon name="arrow" className="size-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── Deux mondes (interlude typographique plein cadre) ─── */}
      <WorldsBand />

      {/* ── Stack ────────────────────────────────────────────── */}
      <Section tone="raise">
        <SectionHead eyebrow={h.stackEyebrow} title={h.stackTitle} href="/stack" cta={copy.common.seeMore} />
        <Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {stack.map((t) => (
              <li key={t.id} className="glass lift group flex flex-col items-center gap-3 rounded-2xl px-3 py-6 text-center">
                <BrandLogo icon={t.icon} name={t.name} className="size-8 transition duration-500 group-hover:scale-110" />
                <span className="text-[11px] font-medium leading-tight text-muted">{t.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* ── IA ───────────────────────────────────────────────── */}
      <Section>
        <SectionHead eyebrow={h.aiEyebrow} title={h.aiTitle} href="/ai-workspace" cta={copy.common.seeMore} tone="signal" />
        <div className="grid gap-4 sm:grid-cols-3">
          {aiTools.map((t, i) => (
            <Reveal key={t.id} delay={i * 70}>
              <GlassCard tone="signal" className="flex h-full items-center gap-4 p-5">
                <BrandLogo icon={t.icon} name={t.name} className="size-9 shrink-0" />
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-[12px] text-muted">{tr(t.role)}</p>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <Section>
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[32px] px-7 py-14 text-center sm:px-14 sm:py-20">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--ember)),rgb(var(--signal)),transparent)]"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember">{tr(copy.common.contactMe)}</p>
            <h2 className="display mx-auto mt-5 max-w-2xl text-3xl font-bold leading-[1.05] sm:text-5xl">{tr(h.contactTitle)}</h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted">{tr(h.contactText)}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className={btn("ember")}>
                {tr(copy.common.contactMe)}
                <Icon name="arrow" className="size-4" />
              </Link>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {site.email || tr(copy.contact.emailTodo)}
              </span>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
