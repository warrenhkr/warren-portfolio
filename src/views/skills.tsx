"use client";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { credentials as staticCredentials, learning, technicalSkills, tools, type Credential, type Skill } from "@/content/skills";
import type { L } from "@/lib/types";
import { cn, GlassCard, IconTile, PageHero, Pill, Reveal, Section, Slot } from "@/components/ui";
import { Icon } from "@/components/Icon";

function GroupHead({ title, count }: { title: L; count?: number }) {
  const { tr } = useLang();
  return (
    <div className="mb-6 flex items-center gap-3">
      <h2 className="display text-2xl font-bold sm:text-3xl">{tr(title)}</h2>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full border border-[rgb(var(--line)/0.12)] px-2 py-0.5 font-mono text-[10px] text-muted">{count}</span>
      )}
    </div>
  );
}

/**
 * `items` vient du serveur (base CMS, repli sur les fichiers) ; sans prop la page
 * reste utilisable seule avec le contenu statique.
 */
/**
 * `items` : compétences publiées lues en base.
 * `credentials` : certifications publiées (collection `certification`), repli sur `src/content/skills.ts`.
 */
export function SkillsView({ items, credentials }: { items?: Skill[]; credentials?: Credential[] }) {
  const { tr } = useLang();
  const c = copy.skills;
  const list = items ?? technicalSkills;
  const certs = credentials ?? staticCredentials;
  const hw = list.filter((s) => s.category === "hardware").length;
  const sw = list.filter((s) => s.category === "software").length;

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        text={c.text}
        current={c.seo}
        meta={[
          { label: c.metaSkills, value: String(list.length).padStart(2, "0") },
          { label: copy.common.hardware, value: String(hw).padStart(2, "0") },
          { label: copy.common.software, value: String(sw).padStart(2, "0") },
        ]}
      />

      <Section>
        <Reveal>
          <GroupHead title={c.technical} count={list.length} />
          <div className="grid gap-4 lg:grid-cols-2">
            {(["hardware", "software"] as const).map((cat) => (
              <GlassCard key={cat} tone={cat} hover={false} className="p-2">
                <div className="flex items-center justify-between rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <IconTile name={cat === "hardware" ? "cpu" : "code"} tone={cat} />
                    <p className="font-heading text-base font-semibold">{tr(copy.common[cat])}</p>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-muted">
                    {String(list.filter((s) => s.category === cat).length).padStart(2, "0")}
                  </span>
                </div>

                <ul className="divide-y divide-[rgb(var(--line)/0.07)]">
                  {list
                    .filter((s) => s.category === cat)
                    .map((s) => (
                      <li key={s.id} className="group flex items-start gap-4 px-5 py-4 transition hover:bg-[rgb(var(--line)/0.03)]">
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-xl border",
                            cat === "hardware"
                              ? "border-[rgb(var(--ember)/0.25)] text-ember"
                              : "border-[rgb(var(--signal)/0.25)] text-signal",
                          )}
                        >
                          <Icon name={s.icon} className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{tr(s.name)}</p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{tr(s.text)}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </Reveal>
      </Section>

      {certs.length > 0 && (
        <Section tone="raise">
          <Reveal>
            <GroupHead title={c.certs} count={certs.length} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certs.map((x) => (
                <GlassCard key={x.id} tone="neutral" className="p-6">
                  <IconTile name="award" tone="neutral" />
                  <p className="mt-4 font-semibold">{tr(x.title)}</p>
                  <p className="mt-1 text-sm text-muted">{[x.issuer, x.year].filter(Boolean).join(" · ")}</p>
                </GlassCard>
              ))}
            </div>
          </Reveal>
        </Section>
      )}

      {tools.length > 0 && (
        <Section>
          <Reveal>
            <GroupHead title={c.tools} count={tools.length} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((x) => (
                <GlassCard key={x.id} tone="ember" className="p-6">
                  <IconTile name={x.icon} />
                  <p className="mt-4 font-semibold">{tr(x.name)}</p>
                  <p className="mt-1 text-sm text-muted">{tr(x.text)}</p>
                </GlassCard>
              ))}
            </div>
          </Reveal>
        </Section>
      )}

      {learning.length > 0 && (
        <Section tone="signal">
          <Reveal>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <GroupHead title={c.learning} count={learning.length} />
              <Pill tone="signal">{tr(c.inProgress)}</Pill>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {learning.map((x) => (
                <GlassCard key={x.id} tone="signal" className="border-dashed p-6">
                  <div className="flex items-center justify-between">
                    <IconTile name={x.icon} tone="signal" />
                    <Pill tone="signal">{tr(c.inProgress)}</Pill>
                  </div>
                  <p className="mt-4 font-semibold">{tr(x.name)}</p>
                  {x.text && <p className="mt-1 text-sm text-muted">{tr(x.text)}</p>}
                </GlassCard>
              ))}
            </div>
          </Reveal>
        </Section>
      )}

      {/* Aucune rubrique publiée : une seule invitation discrète remplace trois blocs vides. */}
      {certs.length === 0 && tools.length === 0 && learning.length === 0 && (
        <Section>
          <Slot label={tr(copy.common.soon)}>{tr(c.slotNote)}</Slot>
        </Section>
      )}
    </>
  );
}
