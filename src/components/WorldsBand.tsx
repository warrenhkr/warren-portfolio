"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { technicalSkills } from "@/content/skills";
import { Reveal } from "./ui";
import { Icon } from "./Icon";

/**
 * Interlude typographique : les deux mondes écrits en très grand, l'un gravé (Hardware),
 * l'autre plein (Software), séparés par une piste diagonale. Casse le rythme des grilles.
 */
export function WorldsBand() {
  const { tr } = useLang();
  const hw = technicalSkills.filter((s) => s.category === "hardware").length;
  const sw = technicalSkills.filter((s) => s.category === "software").length;

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]"
        style={{
          background:
            "linear-gradient(100deg, rgb(196 90 0 / 0.07) 0%, transparent 40%, transparent 60%, rgb(26 59 204 / 0.09) 100%)",
        }}
      />
      <div aria-hidden="true" className="tech-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />

      <div className="relative mx-auto w-full max-w-6xl px-6 sm:px-8">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{tr(copy.home.chain)}</p>
            <Link href="/skills" className="group inline-flex items-center gap-2 text-[13px] font-semibold text-muted transition hover:text-fg">
              {tr(copy.common.seeMore)}
              <Icon name="arrow" className="size-3.5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="relative">
            <div className="group/band relative">
              <p
                className="display select-none text-right text-[clamp(2.4rem,11vw,8.5rem)] font-bold uppercase leading-[0.82] tracking-[-0.04em] text-transparent transition-colors duration-500 [-webkit-text-stroke:1.5px_rgb(var(--ember)/0.55)] hover:text-ember hover:[-webkit-text-stroke:0px]"
              >
                Hardware
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ember sm:text-right">
                {tr(copy.hero.hardwareTags)} · {String(hw).padStart(2, "0")}
              </p>

              <p className="display -mt-2 select-none text-[clamp(2.4rem,11vw,8.5rem)] font-bold uppercase leading-[0.82] tracking-[-0.04em] sm:-mt-6">
                <span className="bg-[linear-gradient(100deg,rgb(var(--fg))_0%,rgb(var(--fg))_38%,rgb(var(--signal))_100%)] bg-clip-text text-transparent">
                  Software
                </span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
                {tr(copy.hero.softwareTags)} · {String(sw).padStart(2, "0")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
