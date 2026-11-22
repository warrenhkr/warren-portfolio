"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { stack as staticStack, type Tech, type TechStatus } from "@/content/stack";
import { BrandLogo } from "./Logo";
import { EMBER_INK, cn } from "./ui";

/* ── Carte électrique : géométrie du circuit (unités du viewBox 1000 × 620) ── */
const W = 1000;
const H = 560;
const SPINE_Y = 280;

type Slot = { x: number; y: number; side: "top" | "bottom" | "left" };
const HW_SLOTS: Slot[] = [{ x: 150, y: 190, side: "left" }];
const SW_SLOTS: Slot[] = [
  { x: 335, y: 132, side: "top" },
  { x: 475, y: 132, side: "top" },
  { x: 615, y: 132, side: "top" },
  { x: 755, y: 132, side: "top" },
  { x: 430, y: 428, side: "bottom" },
  { x: 570, y: 428, side: "bottom" },
  { x: 710, y: 428, side: "bottom" },
];

/** Piste de cuivre : départ sous le composant, coude à 45°, arrivée sur le bus. */
function tracePath({ x, y, side }: Slot) {
  if (side === "left") {
    const from = y + 44;
    return { d: `M${x} ${from} V${from + 16} L${x + 14} ${from + 30} V${SPINE_Y}`, via: x + 14 };
  }
  if (side === "top") {
    const from = y + 44;
    return { d: `M${x} ${from} V${from + 18} L${x + 12} ${from + 30} V${SPINE_Y}`, via: x + 12 };
  }
  const from = y - 44;
  return { d: `M${x} ${from} V${from - 18} L${x - 12} ${from - 30} V${SPINE_Y}`, via: x - 12 };
}

export function StatusBadge({ status, className = "" }: { status: TechStatus; className?: string }) {
  const { tr } = useLang();
  const map = {
    used: { label: copy.stack.used, cls: cn("border-[rgb(var(--ember)/0.35)] bg-[rgb(var(--ember)/0.12)]", EMBER_INK) },
    exploring: { label: copy.stack.exploring, cls: "border-[rgb(var(--signal)/0.35)] bg-[rgb(var(--signal)/0.12)] text-signal" },
    unconfirmed: { label: copy.common.confirm, cls: "border-[rgb(var(--line)/0.16)] bg-[rgb(var(--line)/0.04)] text-muted" },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium leading-none", map.cls, className)}>
      {tr(map.label)}
    </span>
  );
}

type Placed = { tech: Tech; slot: Slot; ref: string; category: "hardware" | "software" };

function place(techs: Tech[]): { placed: Placed[]; overflow: Tech[] } {
  const hw = techs.filter((t) => t.category === "hardware");
  const sw = techs.filter((t) => t.category === "software");
  const placed: Placed[] = [];
  const overflow: Tech[] = [];

  hw.forEach((tech, i) => {
    const slot = HW_SLOTS[i];
    if (!slot) return overflow.push(tech);
    placed.push({ tech, slot, ref: `U${i + 1}`, category: "hardware" });
  });
  sw.forEach((tech, i) => {
    const slot = SW_SLOTS[i];
    if (!slot) return overflow.push(tech);
    placed.push({ tech, slot, ref: `U${hw.length + i + 1}`, category: "software" });
  });
  return { placed, overflow };
}

const led = (status: TechStatus) =>
  status === "used" ? "bg-ember shadow-[0_0_8px_2px_rgb(var(--ember)/0.55)]" : status === "exploring" ? "bg-signal shadow-[0_0_8px_2px_rgb(var(--signal)/0.5)]" : "bg-muted/60";

/** `items` vient du serveur (base CMS, repli sur les fichiers) ; sans prop, contenu statique. */
export function StackBoard({ items }: { items?: Tech[] }) {
  const { tr } = useLang();
  const techs = items ?? staticStack;
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { placed, overflow } = place(techs);
  const activeId = hover ?? pinned;
  const active = placed.find((p) => p.tech.id === activeId) ?? null;

  // Les animations ne tournent que lorsque la carte est à l'écran.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "140px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const clear = useCallback(() => setHover(null), []);

  return (
    <div ref={rootRef} className="glass relative overflow-hidden rounded-[32px] p-4 sm:p-6">
      {/* Halo chaud à gauche (Hardware), froid à droite (Software) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 78% at 0% 52%, rgb(196 90 0 / 0.16), transparent 62%), radial-gradient(58% 78% at 100% 52%, rgb(26 59 204 / 0.18), transparent 62%)",
        }}
      />

      {/* En-tête / lecture */}
      <div className="relative z-10 mb-2 flex flex-wrap items-center justify-between gap-3 px-2 sm:px-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">PCB · {String(techs.length).padStart(2, "0")}</span>
          <p className="truncate font-heading text-sm font-semibold">{active ? active.tech.name : tr(copy.stack.boardHint)}</p>
        </div>
        <div className="flex items-center gap-2">
          {active ? (
            <>
              <span className={cn("font-mono text-[10px] uppercase tracking-[0.16em]", active.category === "hardware" ? "text-ember" : "text-signal")}>
                {tr(active.category === "hardware" ? copy.common.hardware : copy.common.software)}
              </span>
              <StatusBadge status={active.tech.status} />
            </>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{tr(copy.stack.boardIdle)}</span>
          )}
        </div>
      </div>

      {/* Carte imprimée (bureau) */}
      <div className="relative hidden aspect-[1000/560] w-full lg:block" onPointerLeave={clear}>
        <div aria-hidden="true" className="tech-grid absolute inset-0 rounded-[24px] opacity-45" />
        <div aria-hidden="true" className="absolute inset-3 rounded-[20px] border border-[rgb(var(--line)/0.07)]" />

        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="bus" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--ember))" />
              <stop offset="48%" stopColor="rgb(var(--fg) / 0.55)" />
              <stop offset="100%" stopColor="rgb(var(--signal))" />
            </linearGradient>
          </defs>

          {/* Bus : lueur large + trait net + courant animé */}
          <path d={`M60 ${SPINE_Y} H${W - 60}`} stroke="url(#bus)" strokeWidth="16" opacity="0.3" strokeLinecap="round" style={{ filter: "blur(8px)" }} />
          <path d={`M60 ${SPINE_Y} H${W - 60}`} stroke="url(#bus)" strokeWidth="2" strokeLinecap="round" opacity="1" />
          <path
            d={`M60 ${SPINE_Y} H${W - 60}`}
            stroke="rgb(var(--fg))"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.35"
            strokeDasharray="6 90"
            className={visible ? "animate-[flow_11s_linear_infinite]" : undefined}
          />

          {/* Pistes + vias */}
          {placed.map(({ tech, slot, category }) => {
            const { d, via } = tracePath(slot);
            const on = activeId === tech.id;
            const dim = activeId !== null && !on;
            const tint = category === "hardware" ? "rgb(var(--ember))" : "rgb(var(--signal))";
            return (
              <g key={tech.id} opacity={dim ? 0.3 : 1} style={{ transition: "opacity .35s ease" }}>
                <path d={d} stroke="rgb(var(--line) / 0.32)" strokeWidth="2" strokeLinecap="round" />
                <path
                  d={d}
                  stroke={on ? tint : "transparent"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={on ? "12 20" : undefined}
                  className={on && visible ? "animate-[flow_1.05s_linear_infinite]" : undefined}
                  style={{ transition: "stroke .3s ease", filter: on ? "drop-shadow(0 0 5px currentColor)" : undefined }}
                />
                <circle cx={via} cy={SPINE_Y} r={on ? 4.2 : 2.6} fill={on ? tint : "rgb(var(--line) / 0.34)"} style={{ transition: "all .3s ease" }} />
                <circle cx={via} cy={SPINE_Y} r={on ? 9 : 0} fill={tint} opacity="0.18" style={{ transition: "all .3s ease" }} />
              </g>
            );
          })}

          {/* Sérigraphie : pastilles et repères de coin */}
          {[[105, 96], [905, 96], [105, 470], [905, 470], [60, SPINE_Y], [940, SPINE_Y]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.2" fill="none" stroke="rgb(var(--line) / 0.22)" strokeWidth="1.2" />
          ))}
          {[[28, 24], [972, 24], [28, H - 24], [972, H - 24]].map(([x, y], i) => (
            <path
              key={`c${i}`}
              d={`M${x + (i % 2 ? -14 : 14)} ${y} H${x} V${y + (i < 2 ? 14 : -14)}`}
              stroke="rgb(var(--line) / 0.18)"
              strokeWidth="1.2"
            />
          ))}
          {/* Trous de fixation */}
          {[[64, 60], [936, 60], [64, H - 60], [936, H - 60]].map(([cx, cy], i) => (
            <g key={`h${i}`}>
              <circle cx={cx} cy={cy} r="2.6" fill="rgb(var(--line) / 0.14)" />
              <circle cx={cx} cy={cy} r="5.4" fill="none" stroke="rgb(var(--line) / 0.14)" strokeWidth="1" />
            </g>
          ))}
        </svg>

        {/* Composants */}
        {placed.map(({ tech, slot, ref, category }) => {
          const on = activeId === tech.id;
          const dim = activeId !== null && !on;
          return (
            <button
              key={tech.id}
              type="button"
              onPointerEnter={() => setHover(tech.id)}
              onFocus={() => setHover(tech.id)}
              onBlur={clear}
              onClick={() => setPinned((p) => (p === tech.id ? null : tech.id))}
              aria-pressed={pinned === tech.id}
              aria-label={`${tech.name} — ${tr(tech.status === "used" ? copy.stack.used : tech.status === "exploring" ? copy.stack.exploring : copy.common.confirm)}`}
              className={cn(
                "group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 backdrop-blur-md transition duration-300 ease-out",
                "bg-[rgb(var(--raise)/0.72)]",
                on
                  ? category === "hardware"
                    ? "-translate-y-[calc(50%+2px)] border-[rgb(var(--ember)/0.6)] shadow-[0_0_0_1px_rgb(var(--ember)/0.22),0_20px_44px_-22px_rgb(196_90_0/0.85)]"
                    : "-translate-y-[calc(50%+2px)] border-[rgb(var(--signal)/0.6)] shadow-[0_0_0_1px_rgb(var(--signal)/0.22),0_20px_44px_-22px_rgb(26_59_204/0.85)]"
                  : "border-[rgb(var(--line)/0.16)] hover:border-[rgb(var(--line)/0.32)]",
                dim && "opacity-40",
              )}
              style={{ left: `${(slot.x / W) * 100}%`, top: `${(slot.y / H) * 100}%`, width: "15%" }}
            >
              <span aria-hidden="true" className={cn("absolute right-1.5 top-1.5 size-1.5 rounded-full", led(tech.status))} />
              <span aria-hidden="true" className="absolute -top-3 left-1.5 font-mono text-[7px] uppercase tracking-[0.14em] text-muted/45">{ref}</span>
              <BrandLogo icon={tech.icon} name={tech.name} className="size-6" />
              <span className="max-w-full truncate text-[11px] font-medium leading-tight">{tech.name}</span>
            </button>
          );
        })}

        <div className="pointer-events-none absolute inset-x-5 bottom-2.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          <span className="text-ember">hardware · {String(techs.filter((t) => t.category === "hardware").length).padStart(2, "0")}</span>
          <span className="hidden sm:inline">{tr(copy.stack.boardLegend)}</span>
          <span className="text-signal">software · {String(techs.filter((t) => t.category === "software").length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Version compacte (mobile / tablette) */}
      <ul className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden">
        {placed.concat(overflow.map((tech) => ({ tech, slot: HW_SLOTS[0], ref: "", category: tech.category }))).map(({ tech, category }) => (
          <li
            key={tech.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--bg)/0.4)] px-2 py-4 text-center",
              category === "hardware" ? "border-t-[rgb(var(--ember)/0.4)]" : "border-t-[rgb(var(--signal)/0.35)]",
            )}
          >
            <BrandLogo icon={tech.icon} name={tech.name} className="size-7" />
            <span className="text-[11px] font-medium leading-tight">{tech.name}</span>
            <StatusBadge status={tech.status} />
          </li>
        ))}
      </ul>

      {overflow.length > 0 && <p className="relative mt-3 px-2 text-[11px] text-muted">+ {overflow.map((t) => t.name).join(", ")}</p>}
    </div>
  );
}
