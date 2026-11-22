"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { getProject, projects as staticProjects, type Project } from "@/content/projects";
import type { Category, L } from "@/lib/types";
import { cn, Container, GlassCard, IconTile, PageHero, Pill, Reveal, Section, btn } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ProjectCard, ProjectPlate } from "@/components/ProjectCard";

export function ProjectsView({ items }: { items?: Project[] }) {
  const { tr } = useLang();
  const p = copy.projects;
  const projects = items ?? staticProjects;
  const [filter, setFilter] = useState<"all" | Category>("all");
  const shown = projects.filter((x) => filter === "all" || x.category === filter);
  /** Une seule fiche : elle occupe deux colonnes, les tuiles d'appoint se partagent la troisième. */
  const solo = shown.length === 1;
  const tabs: { id: "all" | Category; label: L }[] = [
    { id: "all", label: copy.common.all },
    { id: "hardware", label: copy.common.hardware },
    { id: "software", label: copy.common.software },
  ];
  const hardware = projects.filter((x) => x.category === "hardware").length;
  const software = projects.filter((x) => x.category === "software").length;

  return (
    <>
      <PageHero
        eyebrow={p.eyebrow}
        title={p.title}
        text={p.text}
        current={p.seo}
        meta={[
          { label: p.metaTotal, value: String(projects.length).padStart(2, "0") },
          { label: copy.common.hardware, value: String(hardware).padStart(2, "0") },
          { label: copy.common.software, value: String(software).padStart(2, "0") },
        ]}
      />

      <Section className="pt-14">
        <div
          role="group"
          aria-label={tr(p.seo)}
          className="mb-8 inline-flex flex-wrap gap-1 rounded-full border border-[rgb(var(--line)/0.1)] p-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium transition",
                filter === t.id ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {tr(t.label)}
            </button>
          ))}
        </div>

        {/* Grille : une seule fiche → elle tient deux colonnes, l'emplacement libre et le Lab se partagent la troisième. */}
        {solo ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <ProjectCard p={shown[0]} featured heading="h2" />
            </div>
            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row lg:col-span-1 lg:flex-col">
              <Reveal delay={60} className="flex flex-1">
                <SlotTile />
              </Reveal>
              <Reveal delay={120} className="flex flex-1">
                <LabTile />
              </Reveal>
            </div>
          </div>
        ) : (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((x) => (
              <ProjectCard key={x.slug} p={x} heading="h2" />
            ))}

            {shown.length > 0 && (
              <>
                <Reveal delay={60} className="flex h-full">
                  <SlotTile />
                </Reveal>
                <Reveal delay={120} className="flex h-full">
                  <LabTile />
                </Reveal>
              </>
            )}
          </div>
        )}

        {shown.length === 0 && (
          <div>
            <div className="glass-quiet flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center">
              <span className="grid size-11 place-items-center rounded-2xl border border-[rgb(var(--line)/0.12)] text-muted">
                <Icon name="grid" className="size-5" />
              </span>
              <p className="max-w-sm text-sm leading-relaxed text-muted">{tr(p.emptyFilter)}</p>
              <button type="button" onClick={() => setFilter("all")} className={btn("secondary", "sm")}>
                {tr(copy.common.all)}
              </button>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tuiles d'appoint : emplacement libre (cadré, jamais béant)
   et passerelle vers le Lab (registre visuel distinct).
   ───────────────────────────────────────────────────────────── */

function SlotTile() {
  const { tr } = useLang();
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-dashed border-[rgb(var(--line)/0.18)] bg-[rgb(var(--line)/0.02)] p-6">
      <div
        aria-hidden="true"
        className="tech-grid absolute inset-0 opacity-50 [background-size:28px_28px] [mask-image:radial-gradient(85%_75%_at_50%_0%,black,transparent)]"
      />
      {/* Repère de perçage : le vide est dessiné, pas subi. */}
      <div aria-hidden="true" className="relative flex min-h-[86px] flex-1 items-center justify-center">
        <span className="absolute h-px w-16 bg-[rgb(var(--line)/0.16)]" />
        <span className="absolute h-16 w-px bg-[rgb(var(--line)/0.16)]" />
        <span className="relative grid size-10 place-items-center rounded-2xl border border-dashed border-[rgb(var(--line)/0.24)] bg-[rgb(var(--bg)/0.6)] text-muted">
          <Icon name="plus" className="size-4" />
        </span>
      </div>
      <div className="relative border-t border-[rgb(var(--line)/0.08)] pt-4">
        <p className="mono-label">{tr(copy.projects.slotTitle)}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{tr(copy.projects.slotText)}</p>
      </div>
    </div>
  );
}

function LabTile() {
  const { tr } = useLang();
  return (
    <Link
      href="/lab"
      className="group flex h-full w-full flex-col rounded-3xl border border-[rgb(var(--signal)/0.22)] bg-[rgb(var(--signal)/0.07)] p-6 transition duration-300 hover:border-[rgb(var(--signal)/0.45)] hover:bg-[rgb(var(--signal)/0.1)]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[rgb(var(--signal)/0.3)] bg-[rgb(var(--signal)/0.14)] text-signal">
        <Icon name="flask" className="size-4" />
      </span>
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-lg font-semibold">{tr(copy.lab.eyebrow)}</p>
          <Icon name="arrow" className="size-4 shrink-0 text-signal transition group-hover:translate-x-1" />
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{tr(copy.lab.projectsVsLab)}</p>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────
   Fiche projet : éditoriale, sommaire collant, contenus réels seulement
   ───────────────────────────────────────────────────────────── */
export function ProjectDetailView({ slug, project }: { slug: string; project?: Project }) {
  const { tr } = useLang();
  const p = project ?? getProject(slug);
  const s = copy.projects.sections;
  if (!p) {
    return (
      <Section>
        <Container>
          <p className="pt-24">{tr(copy.projects.notFound)}</p>
        </Container>
      </Section>
    );
  }

  const hw = p.category === "hardware";

  const blocks: { id: string; title: L; has: boolean; body?: L; list?: L[] }[] = [
    { id: "description", title: s.description, has: Boolean(p.description), body: p.description },
    { id: "problem", title: s.problem, has: Boolean(p.problem), body: p.problem },
    { id: "goals", title: s.goals, has: Boolean(p.goals?.length), list: p.goals },
    { id: "solution", title: s.solution, has: Boolean(p.solution), body: p.solution },
    { id: "role", title: s.role, has: Boolean(p.role), body: p.role },
    { id: "results", title: s.results, has: Boolean(p.results), body: p.results },
  ];
  const filled = blocks.filter((b) => b.has);
  const missing = blocks.filter((b) => !b.has);
  const hasGallery = Boolean(p.gallery?.length);
  const hasVideos = Boolean(p.videos?.length);
  const hasLinks = Boolean(p.links?.github || p.links?.demo);
  const count = `${String(filled.length).padStart(2, "0")}/${String(blocks.length).padStart(2, "0")}`;

  return (
    <>
      <section className="relative overflow-hidden pt-24 sm:pt-32">
        <Container>
          <Link href="/projects" className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-fg">
            <Icon name="arrow" className="size-4 rotate-180" />
            {tr(copy.projects.back)}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Pill tone={hw ? "ember" : "signal"}>{tr(hw ? copy.common.hardware : copy.common.software)}</Pill>
            {p.tech.slice(0, 6).map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>

          <h1 className="display mt-6 max-w-4xl text-[2.6rem] font-bold leading-[0.98] sm:text-6xl lg:text-7xl">{tr(p.title)}</h1>
          {p.summary && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{tr(p.summary)}</p>}

          {p.image ? (
            <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[32px] border border-[rgb(var(--line)/0.1)]">
              <Image src={p.image} alt={tr(p.title)} fill priority sizes="100vw" className="object-cover" />
            </div>
          ) : (
            /* Même plaque que sur la carte : le visuel manquant est dessiné, pas laissé vide. */
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[32px] border border-[rgb(var(--line)/0.12)] sm:aspect-[16/6]">
              <ProjectPlate hw={hw} note={tr(copy.common.todo)} slug={p.slug} />
            </div>
          )}
        </Container>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* sommaire — rappel collant de ce qui est renseigné et de ce qui manque */}
          <aside className="order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <div className="glass-quiet rounded-3xl p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="mono-label">{tr(copy.projects.overview)}</p>
                  <p className="font-mono text-[10px] tabular-nums text-muted">
                    <span className="text-fg">{String(filled.length).padStart(2, "0")}</span>/{String(blocks.length).padStart(2, "0")}
                  </p>
                </div>

                <div aria-hidden="true" className="mt-3 flex gap-1">
                  {blocks.map((b) => (
                    <span
                      key={b.id}
                      className={cn("h-0.5 flex-1 rounded-full", b.has ? (hw ? "bg-ember" : "bg-signal") : "bg-[rgb(var(--line)/0.14)]")}
                    />
                  ))}
                </div>

                <ul className="mt-4 space-y-0.5 border-t border-[rgb(var(--line)/0.08)] pt-3">
                  {blocks.map((b, i) => (
                    <li key={b.id}>
                      {b.has ? (
                        <a
                          href={`#${b.id}`}
                          className="group flex items-baseline gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-fg transition hover:bg-[rgb(var(--line)/0.05)]"
                        >
                          <span className="font-mono text-[10px] tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                          <span className="flex-1">{tr(b.title)}</span>
                          <Icon
                            name="arrow"
                            className="size-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                          />
                        </a>
                      ) : (
                        <span className="flex items-baseline gap-2.5 px-2 py-1.5 text-[13px] text-muted">
                          <span className="font-mono text-[10px] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                          <span className="flex-1">{tr(b.title)}</span>
                          <span aria-hidden="true" className="h-px w-3 self-center bg-current opacity-40" />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* contenu */}
          <div className="order-1 space-y-6 lg:order-2">
            {filled.length === 0 && (
              <GlassCard tone={hw ? "ember" : "signal"} hover={false} className="overflow-hidden p-0">
                <div className="relative border-b border-[rgb(var(--line)/0.08)] p-7 sm:p-9">
                  <div
                    aria-hidden="true"
                    className="tech-grid absolute inset-0 opacity-50 [background-size:32px_32px] [mask-image:radial-gradient(90%_100%_at_0%_0%,black,transparent_72%)]"
                  />
                  <div className="relative flex items-start gap-4">
                    <IconTile name="flask" tone={hw ? "ember" : "signal"} />
                    <div className="min-w-0">
                      <h2 className="display text-2xl font-semibold sm:text-[1.7rem]">{tr(copy.projects.pendingTitle)}</h2>
                      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{tr(copy.projects.pendingText)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-7 sm:p-9">
                  <p className="mono-label">{tr(copy.common.todo)}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {missing.map((b) => (
                      <li key={b.id}>
                        <Pill>{tr(b.title)}</Pill>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            )}

            {filled.map((b) => (
              <Reveal key={b.id}>
                <div id={b.id} className="scroll-mt-24">
                  <GlassCard tone={hw ? "ember" : "signal"} hover={false} className="p-7 sm:p-8">
                    <h2 className="font-heading text-lg font-semibold">{tr(b.title)}</h2>
                    {b.body && <p className="mt-3 text-[15px] leading-relaxed text-muted">{tr(b.body)}</p>}
                    {b.list && (
                      <ul className="mt-4 space-y-2">
                        {b.list.map((g) => (
                          <li key={g.fr} className="flex gap-3 text-[15px] text-muted">
                            <Icon name="check" className={cn("mt-0.5 size-4 shrink-0", hw ? "text-ember" : "text-signal")} />
                            {tr(g)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>
                </div>
              </Reveal>
            ))}

            {hasGallery && (
              <div className="grid gap-3 sm:grid-cols-2">
                {p.gallery!.map((g) => (
                  <div key={g.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.1)]">
                    <Image src={g.src} alt={tr(g.alt)} fill loading="lazy" sizes="(min-width:1024px) 33vw, 50vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {(hasLinks || hasVideos) && (
              <GlassCard tone="neutral" hover={false} className="p-7">
                <div className="flex flex-wrap gap-3">
                  {p.links?.github && (
                    <a className={btn("secondary", "sm")} href={p.links.github} target="_blank" rel="noopener noreferrer">
                      <Icon name="external" className="size-3.5" />
                      {tr(copy.projects.github)}
                    </a>
                  )}
                  {p.links?.demo && (
                    <a className={btn("primary", "sm")} href={p.links.demo} target="_blank" rel="noopener noreferrer">
                      {tr(copy.projects.demo)}
                      <Icon name="arrow" className="size-3.5" />
                    </a>
                  )}
                  {p.videos?.map((v) => (
                    <a key={v.url} className={btn("ghost", "sm")} href={v.url} target="_blank" rel="noopener noreferrer">
                      {tr(v.label)}
                      <Icon name="external" className="size-3.5" />
                    </a>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
