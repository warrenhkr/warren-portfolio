"use client";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import type { Project } from "@/content/projects";
import { Icon } from "./Icon";
import { Pill, cn } from "./ui";

/* ─────────────────────────────────────────────────────────────
   Plaque technique : l'état « sans visuel » est dessiné, pas subi.
   Tout est CSS + SVG inline (aucune image, aucun canvas) :
   trame de calque, cadre de repérage, tracé schématique, cotes.
   ───────────────────────────────────────────────────────────── */

/** Pistes de cuivre (Hardware) : coudes à 45°, comme sur un circuit imprimé. */
const PCB_TRACES = [
  "M164 74V56H120L108 68",
  "M180 74V50H228L240 62",
  "M196 74V62H216",
  "M144 96H122L108 84V72",
  "M144 110H100",
  "M144 124H126L112 138V156H96",
  "M216 96H242L254 84",
  "M216 110H264V88",
  "M216 124H238V154L228 164",
  "M164 146V168H124L112 180",
  "M180 146V176H232",
  "M196 146V162H218L228 172",
];

/** Pastilles de perçage aux extrémités des pistes. */
const PCB_VIAS: [number, number][] = [
  [108, 68],
  [240, 62],
  [216, 62],
  [108, 72],
  [100, 110],
  [96, 156],
  [254, 84],
  [264, 88],
  [228, 164],
  [112, 180],
  [232, 176],
  [228, 172],
];

/** Blocs du schéma (Software) : trois modules reliés par des liaisons coudées. */
const SW_BLOCKS = [
  { x: 108, y: 58, w: 84, h: 32 },
  { x: 108, y: 130, w: 84, h: 32 },
  { x: 216, y: 94, w: 92, h: 32 },
];

export function ProjectPlate({ hw, note, slug }: { hw: boolean; note: string; slug?: string }) {
  const tint = (a: number) => (hw ? `rgb(var(--ember) / ${a})` : `rgb(var(--signal) / ${a})`);

  /* Quadrillage : trame fine à 24 px + trame majeure à 96 px, dans la teinte de la catégorie. */
  const quilt = {
    backgroundImage: [
      `linear-gradient(to right, ${tint(0.085)} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${tint(0.085)} 1px, transparent 1px)`,
      "linear-gradient(to right, rgb(var(--line) / 0.1) 1px, transparent 1px)",
      "linear-gradient(to bottom, rgb(var(--line) / 0.1) 1px, transparent 1px)",
    ].join(","),
    backgroundSize: "24px 24px, 24px 24px, 96px 96px, 96px 96px",
    maskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Fond : dégradé de catégorie, chaud d'un côté, froid de l'autre */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: hw
            ? `radial-gradient(115% 110% at 14% 0%, ${tint(0.22)}, transparent 58%), radial-gradient(85% 90% at 98% 100%, rgb(var(--signal) / 0.11), transparent 62%)`
            : `radial-gradient(115% 110% at 86% 0%, ${tint(0.22)}, transparent 58%), radial-gradient(85% 90% at 2% 100%, rgb(var(--ember) / 0.1), transparent 62%)`,
        }}
      />
      <div aria-hidden="true" className="absolute inset-0" style={quilt} />

      {/* Rétro-éclairage doux derrière le tracé */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: `radial-gradient(closest-side, ${tint(0.16)}, transparent 74%)` }}
      />

      {/* Tracé : circuit (Hardware) ou schéma fonctionnel (Software) */}
      <svg
        viewBox="0 0 360 220"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
      >
        <g stroke={tint(0.3)} strokeWidth="1" strokeLinecap="round">
          {/* cotes */}
          <path d={hw ? "M152 44H208" : "M108 40H308"} />
          <path d={hw ? "M152 40V48M208 40V48" : "M108 36V44M308 36V44"} />
          <path d={hw ? "M64 82V138" : "M62 58V162"} />
          <path d={hw ? "M60 82H68M60 138H68" : "M58 58H66M58 162H66"} />
        </g>

        {hw ? (
          <g>
            {PCB_TRACES.map((d) => (
              <g key={d}>
                <path d={d} stroke="rgb(var(--line) / 0.26)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d={d}
                  stroke={tint(0.5)}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5 24"
                  className="opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              </g>
            ))}
            {PCB_VIAS.map(([cx, cy], i) => (
              <g key={`v${i}`}>
                <circle cx={cx} cy={cy} r="3.4" stroke="rgb(var(--line) / 0.22)" strokeWidth="1" />
                <circle cx={cx} cy={cy} r="1.3" fill={tint(0.45)} />
              </g>
            ))}
            {/* le composant central */}
            <rect x="152" y="82" width="56" height="56" rx="4" stroke={tint(0.55)} strokeWidth="1.5" />
            <rect x="163" y="93" width="34" height="34" rx="2" stroke="rgb(var(--line) / 0.2)" strokeWidth="1" />
            <path d="M170 110H190M180 100V120" stroke={tint(0.35)} strokeWidth="1" />
          </g>
        ) : (
          <g>
            {SW_BLOCKS.map((b, i) => (
              <rect
                key={b.x}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="6"
                stroke={i === 2 ? tint(0.5) : "rgb(var(--line) / 0.28)"}
                strokeWidth="1.4"
              />
            ))}
            <path
              d="M192 74H228V94M192 146H252V126"
              stroke="rgb(var(--line) / 0.26)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="192" cy="74" r="1.8" fill={tint(0.45)} />
            <circle cx="192" cy="146" r="1.8" fill={tint(0.45)} />
            <g stroke="rgb(var(--line) / 0.18)" strokeWidth="1.2" strokeLinecap="round">
              <path d="M120 70H178M120 80H160" />
              <path d="M120 142H178M120 152H154" />
              <path d="M228 106H292M228 114H276M228 122H262" />
            </g>
            {/* crochets de code, en bordure du schéma */}
            <path
              d="M84 86 68 110 84 134M332 86 348 110 332 134"
              stroke="rgb(var(--line) / 0.18)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>

      {/* Cadre de repérage et équerres */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[22px] border border-[rgb(var(--line)/0.1)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-3">
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-b border-l",
          "right-0 bottom-0 border-b border-r",
        ].map((c) => (
          <span key={c} className={cn("absolute size-3.5", c)} style={{ borderColor: tint(0.45) }} />
        ))}
      </div>

      {/* Légende : statut du visuel à gauche, référence de la fiche à droite */}
      <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          <Icon name="image" className="size-3 opacity-70" />
          {note}
        </span>
        {slug && (
          <span className="hidden max-w-[52%] truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:block">
            REF · {slug}
          </span>
        )}
      </div>
    </div>
  );
}

/** Carte projet : bento, verre, halo suiveur. `featured` occupe deux colonnes. */
export function ProjectCard({
  p,
  featured = false,
  heading = "h3",
}: {
  p: Project;
  featured?: boolean;
  /** Niveau du titre : h3 sous un h2 de section (accueil), h2 seul en tête de grille (/projects). */
  heading?: "h2" | "h3";
}) {
  const { tr } = useLang();
  const hw = p.category === "hardware";
  const Heading = heading as "h3";

  return (
    <Link
      href={`/projects/${p.slug}`}
      className={cn(
        "glass spot group relative isolate flex h-full flex-col overflow-hidden rounded-3xl transition duration-500 hover:-translate-y-1 hover:border-[rgb(var(--line)/0.2)]",
        hw ? "" : "spot-signal",
        featured && "sm:col-span-2",
      )}
    >
      <span aria-hidden="true" className="spot-glow" />

      {/* La plaque prend la hauteur restante : elle n'a jamais de bande vide sous le tracé. */}
      <div className={cn("relative overflow-hidden", featured ? "min-h-[240px] flex-1 sm:min-h-[320px]" : "aspect-[16/10]")}>
        {p.image ? (
          <Image
            src={p.image}
            alt=""
            fill
            sizes="(min-width:1024px) 66vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <ProjectPlate hw={hw} note={tr(copy.common.todo)} slug={p.slug} />
        )}

        <div className="absolute left-5 top-5 z-10">
          <Pill tone={hw ? "ember" : "signal"}>{tr(hw ? copy.common.hardware : copy.common.software)}</Pill>
        </div>
        <span
          aria-hidden="true"
          className="absolute right-5 top-5 z-10 grid size-9 place-items-center rounded-full border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--bg)/0.35)] text-fg backdrop-blur-md transition duration-300 group-hover:rotate-45"
        >
          <Icon name="arrow" className="size-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Heading className={cn("display font-semibold", featured ? "text-2xl sm:text-3xl" : "text-lg")}>{tr(p.title)}</Heading>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {p.summary ? tr(p.summary) : tr(copy.projects.summaryTodo)}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[rgb(var(--line)/0.08)] pt-4">
          {p.tech.length ? (
            p.tech.slice(0, 5).map((t) => <Pill key={t}>{t}</Pill>)
          ) : (
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <span aria-hidden="true" className="h-px w-4 bg-current opacity-50" />
              {tr(copy.projects.techTodo)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
