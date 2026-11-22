"use client";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { labEntries as staticEntries, labKinds, type LabEntry } from "@/content/lab";
import { cn, Eyebrow, PageHero, Pill, Reveal, Section } from "@/components/ui";
import { Icon } from "@/components/Icon";

const pad = (n: number) => String(n).padStart(2, "0");

/** Une entrée de labo : ne s'affiche que lorsque la liste en contient réellement. */
function LabEntryItem({ entry }: { entry: LabEntry }) {
  const { tr } = useLang();
  return (
    <li className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.03)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-heading text-sm font-semibold leading-snug">{tr(entry.title)}</p>
        <Pill tone={entry.category === "hardware" ? "ember" : "signal"}>{tr(copy.common[entry.category])}</Pill>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{tr(entry.text)}</p>

      {entry.tech && entry.tech.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {entry.tech.map((t) => (
            <li key={t}>
              <Pill tone="neutral">{t}</Pill>
            </li>
          ))}
        </ul>
      )}

      {entry.link && (
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-signal transition hover:text-fg"
        >
          {tr(copy.common.visit)}
          <Icon name="external" className="size-3.5" />
        </a>
      )}
    </li>
  );
}

/**
 * `entries` : entrées publiées lues en base (repli sur `src/content/lab.ts` si la base est vide).
 * Le composant reste client pour la bascule FR/EN ; les données arrivent déjà résolues du serveur.
 */
export function LabView({ entries }: { entries?: LabEntry[] }) {
  const { tr } = useLang();
  const c = copy.lab;
  const list = entries ?? staticEntries;
  const total = list.length;

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        text={c.text}
        current={c.seo}
        meta={[
          { label: c.metaKinds, value: pad(labKinds.length) },
          // « Tous 00 » n'apparaît que s'il y a des entrées : le vide est dit une
          // seule fois, dans le panneau d'attente, pas dans l'en-tête.
          ...(total > 0 ? [{ label: copy.common.all, value: pad(total) }] : []),
        ]}
      />

      <Section className="pt-14">
        {/* Chapeau éditorial : la phrase de cadrage reste un texte d'accompagnement,
            pas un titre géant — les six catégories doivent dominer la page. */}
        <header className="mb-10 max-w-2xl">
          <Eyebrow tone="signal">{tr(c.metaKinds)}</Eyebrow>
          <h2 className="display text-xl font-semibold leading-snug text-fg sm:text-2xl">{tr(c.projectsVsLab)}</h2>
        </header>

        <div className={cn("grid gap-10", total === 0 && "lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-14")}>
          <Reveal>
            <ol className="border-t border-[rgb(var(--line)/0.14)]">
              {labKinds.map((k, i) => {
                const items = list.filter((e) => e.kind === k.kind);
                return (
                  <li
                    key={k.kind}
                    className="grid grid-cols-[2.25rem_1fr] gap-x-4 border-b border-[rgb(var(--line)/0.10)] py-6 sm:grid-cols-[3.25rem_1fr] sm:gap-x-6 sm:py-7"
                  >
                    <div className="flex flex-col items-start gap-3">
                      <span className="font-mono text-[11px] leading-none tabular-nums text-muted">{pad(i + 1)}</span>
                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-lg border border-[rgb(var(--signal)/0.24)] bg-[rgb(var(--signal)/0.10)] text-signal"
                      >
                        <Icon name={k.icon} className="size-4" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="display text-base font-semibold leading-snug sm:text-lg">{tr(k.title)}</h3>
                        {/* Le compteur n'apparaît que s'il y a quelque chose à compter :
                            six « 00 » alignés répétaient le vide au lieu de l'assumer. */}
                        {items.length > 0 && (
                          <span className="shrink-0 font-mono text-[12px] tabular-nums text-signal">
                            {pad(items.length)}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted">{tr(k.text)}</p>

                      {items.length > 0 && (
                        <ul className="mt-5 space-y-3 sm:border-l sm:border-[rgb(var(--line)/0.12)] sm:pl-5">
                          {items.map((e) => (
                            <LabEntryItem key={e.id} entry={e} />
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          {total === 0 && (
            <Reveal delay={100}>
              <aside className="relative isolate overflow-hidden rounded-3xl border border-dashed border-[rgb(var(--line)/0.18)] px-6 py-8 sm:px-8 sm:py-9 lg:sticky lg:top-28">
                <span aria-hidden="true" className="tech-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
                <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-signal/70" />
                  {tr(copy.common.soon)}
                </p>
                <p className="display mt-4 text-xl font-semibold leading-snug text-fg sm:text-[1.4rem]">{tr(c.empty)}</p>
                <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-[rgb(var(--line)/0.12)] pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{tr(copy.common.all)}</span>
                  <span className="font-mono text-2xl leading-none tabular-nums text-muted">
                    {pad(total)}
                    <span className="ml-1 text-[12px] text-muted">/ {pad(labKinds.length)}</span>
                  </span>
                </div>
              </aside>
            </Reveal>
          )}
        </div>
      </Section>
    </>
  );
}