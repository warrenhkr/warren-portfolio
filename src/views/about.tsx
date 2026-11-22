"use client";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { domains, portrait } from "@/content/about";
import { cn, Eyebrow, GlassCard, IconTile, PageHero, Reveal, Section, Slot, btn } from "@/components/ui";
import { Icon } from "@/components/Icon";

export function AboutView() {
  const { tr } = useLang();
  const a = copy.about;

  return (
    <>
      <PageHero
        eyebrow={a.eyebrow}
        title={a.title}
        text={a.text}
        current={a.seo}
        meta={[
          { label: copy.common.hardware, value: String(domains.hardware.length).padStart(2, "0") },
          { label: copy.common.software, value: String(domains.software.length).padStart(2, "0") },
        ]}
      />

      {/* Identité + portrait */}
      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <div>
              <Eyebrow>{tr(a.who)}</Eyebrow>
              <h2 className="display text-3xl font-bold leading-[1.06] sm:text-[2.6rem]">{tr(a.whoText)}</h2>

              <div className="relative mt-8 flex flex-wrap gap-3">
                <Link href="/projects" className={btn("primary", "sm")}>
                  {tr(copy.common.discover)}
                  <Icon name="arrow" className="size-3.5" />
                </Link>
                <Link href="/contact" className={btn("secondary", "sm")}>
                  {tr(copy.common.contactMe)}
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <figure className="relative">
              <div className="absolute -inset-2 rounded-[36px] bg-[linear-gradient(140deg,rgb(196_90_0/0.22),transparent_45%,rgb(26_59_204/0.22))] blur-2xl" aria-hidden="true" />
              {portrait ? (
                <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-[rgb(var(--line)/0.12)]">
                  <Image src={portrait} alt={tr(copy.common.portraitAlt)} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                </div>
              ) : (
                <div className="glass relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[32px] p-8 text-center">
                  <div aria-hidden="true" className="tech-grid absolute inset-0 opacity-60" />
                  <div className="relative">
                    <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[linear-gradient(135deg,#C45A00,#1A3BCC)] font-heading text-2xl font-bold text-white shadow-ember">
                      WH
                    </span>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{tr(copy.common.portrait)}</p>
                    <p className="mx-auto mt-3 max-w-[220px] text-[13px] leading-relaxed text-muted">{tr(a.portraitTodo)}</p>
                  </div>
                </div>
              )}
            </figure>
          </Reveal>
        </div>
      </Section>

      {/* Parcours */}
      <Section tone="raise">
        <Reveal>
          <Eyebrow tone="signal">{tr(a.journey)}</Eyebrow>
          <div className="grid max-w-xl gap-4">
            <GlassCard tone="neutral" className="p-7">
              <div className="flex items-center gap-3">
                <IconTile name="graduation" tone="neutral" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{tr(copy.common.education)}</p>
              </div>
              <p className="mt-5 font-heading text-lg font-semibold leading-snug">{tr(a.degree)}</p>
            </GlassCard>
          </div>
        </Reveal>
      </Section>

      {/* Ce que je fais */}
      <Section>
        <Reveal>
          <Eyebrow>{tr(a.whatIDo)}</Eyebrow>
          <div className="grid gap-4 md:grid-cols-2">
            {(["hardware", "software"] as const).map((cat) => (
              <GlassCard key={cat} tone={cat} className="p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <IconTile name={cat === "hardware" ? "cpu" : "code"} tone={cat} />
                  <h3 className="font-heading text-xl font-semibold">{tr(copy.common[cat])}</h3>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{tr(cat === "hardware" ? a.hardwareIntro : a.softwareIntro)}</p>
                <ul className="mt-6 space-y-2.5">
                  {domains[cat].map((d) => (
                    <li key={d.fr} className="flex items-center gap-3 text-sm text-fg/80">
                      <span aria-hidden="true" className={cn("size-1 rounded-full", cat === "hardware" ? "bg-ember" : "bg-signal")} />
                      {tr(d)}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Vision */}
      <Section tone="signal">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow tone="signal">{tr(a.vision)}</Eyebrow>
            <blockquote className="display text-2xl font-semibold leading-[1.2] sm:text-4xl">
              <span className="text-ember">«</span> {tr(copy.hero.tagline)} <span className="text-signal">»</span>
            </blockquote>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
