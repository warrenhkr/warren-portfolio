"use client";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { stack as staticStack, type Tech } from "@/content/stack";
import { PageHero, Reveal, Section } from "@/components/ui";
import { IconTile } from "@/components/ui";
import { StackBoard } from "@/components/StackBoard";

/** `items` vient du serveur (base CMS, repli sur les fichiers) ; sans prop, contenu statique. */
export function StackView({ items }: { items?: Tech[] }) {
  const { tr } = useLang();
  const c = copy.stack;
  const techs = items ?? staticStack;

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        text={c.text}
        current={c.seo}
        meta={[
          { label: c.metaTechs, value: String(techs.length).padStart(2, "0") },
          { label: c.used, value: String(techs.filter((t) => t.status === "used").length).padStart(2, "0") },
          { label: c.exploring, value: String(techs.filter((t) => t.status !== "used").length).padStart(2, "0") },
        ]}
      />

      <Section className="pt-14">
        {/* Repère de structure : la page n'avait qu'un h1 pour la carte interactive. */}
        <h2 className="sr-only">{tr(c.eyebrow)}</h2>
        <Reveal>
          <div className="mb-7 grid gap-5 sm:grid-cols-2">
            {(["hardware", "software"] as const).map((cat) => (
              <div key={cat} className="flex items-start gap-3">
                <IconTile name={cat === "hardware" ? "cpu" : "code"} tone={cat} />
                <div>
                  <p className="font-heading text-sm font-semibold">{tr(copy.common[cat])}</p>
                  <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
                    {tr(cat === "hardware" ? c.hardwareText : c.softwareText)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <StackBoard items={techs} />
        </Reveal>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-[12px] leading-relaxed text-muted">{tr(c.legend)}</p>
        </div>
      </Section>
    </>
  );
}
