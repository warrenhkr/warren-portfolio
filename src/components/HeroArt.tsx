"use client";

import { useEffect, useRef } from "react";
import { domains } from "@/content/about";
import { copy } from "@/content/copy";
import { useLang } from "@/lib/i18n";
import { Icon } from "./Icon";

type Rgb = [number, number, number];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/* ── Une rangée de lecture façon instrument ─────────────────── */
function Readout({ tone, label, value }: { tone: "ember" | "signal"; label: string; value: string }) {
  const dot = tone === "ember" ? "bg-ember" : "bg-signal";
  const text = tone === "ember" ? "text-ember" : "text-signal";
  return (
    <div className="flex gap-2.5">
      <span aria-hidden="true" className={`mt-[5px] size-1.5 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className={`font-mono text-[10px] uppercase leading-none tracking-[0.2em] ${text}`}>{label}</p>
        <p className="mt-1.5 font-mono text-[10px] leading-[1.7] text-fg/70">{value}</p>
      </div>
    </div>
  );
}

/**
 * Instrument unique du héros : une dalle de verre, un oscilloscope vivant (canvas 2D)
 * et deux lectures Hardware / Software. Décoratif : seuls le programme et les domaines
 * réels sont affichés — aucune mesure, aucun pourcentage inventé.
 */
export function HeroArt() {
  const { tr } = useLang();
  const zoneRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Oscilloscope ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let ember: Rgb = [196, 90, 0];
    let signal: Rgb = [26, 59, 204];
    let line: Rgb = [255, 255, 255];

    const readColor = (name: string, fallback: Rgb): Rgb => {
      const raw = getComputedStyle(canvas).getPropertyValue(name).trim();
      const parts = raw.match(/\d+(?:\.\d+)?/g);
      if (!parts || parts.length < 3) return fallback;
      return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
    };
    const readPalette = () => {
      ember = readColor("--ember", ember);
      signal = readColor("--signal", signal);
      line = readColor("--line", line);
    };
    const rgba = (c: Rgb, a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let phase = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    let disposed = false;

    const FRAME = 1000 / 40; // plafond ~40 fps

    const paint = () => {
      if (width < 2 || height < 2) return;
      const w = width;
      const h = height;
      const mid = h / 2;
      const amp = h * 0.3;

      ctx.clearRect(0, 0, w, h);

      /* Repères d'oscilloscope : ligne médiane pointillée + graduations au bord */
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = rgba(line, 0.14);
      ctx.beginPath();
      ctx.moveTo(0, Math.round(mid) + 0.5);
      ctx.lineTo(w, Math.round(mid) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = rgba(line, 0.16);
      ctx.beginPath();
      for (let i = 1; i < 7; i += 1) {
        const x = Math.round((w * i) / 7) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 4.5);
        ctx.moveTo(x, h);
        ctx.lineTo(x, h - 4.5);
      }
      ctx.stroke();

      /* Onde : somme de deux sinus + un peu de bruit */
      const step = w > 520 ? 2 : 1.5;
      const count = Math.max(2, Math.ceil(w / step) + 1);
      const ys: number[] = new Array(count);
      for (let i = 0; i < count; i += 1) {
        const u = i / (count - 1);
        const a = Math.sin(u * Math.PI * 2 * 1.15 + phase * 1.1) * 0.66;
        const b = Math.sin(u * Math.PI * 2 * 0.62 - phase * 0.6 + 1.35) * 0.34;
        const noise = (Math.random() - 0.5) * 0.05;
        ys[i] = mid - (a + b + noise) * amp;
      }

      const trace = () => {
        ctx.beginPath();
        for (let i = 0; i < count; i += 1) {
          const x = (i / (count - 1)) * w;
          if (i === 0) ctx.moveTo(x, ys[i]);
          else ctx.lineTo(x, ys[i]);
        }
      };

      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, rgba(ember, 1));
      gradient.addColorStop(1, rgba(signal, 1));

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = gradient;

      /* Halo diffus, puis trait fin */
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 3.5;
      trace();
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      trace();
      ctx.stroke();
    };

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width));
      const nextH = Math.max(1, Math.round(rect.height));
      const nextDpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      if (nextW === width && nextH === height && nextDpr === dpr) return;
      width = nextW;
      height = nextH;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || document.hidden || !visible) return;
      if (!last) last = now - FRAME;
      const elapsed = now - last;
      if (elapsed >= FRAME) {
        last = now;
        phase += Math.min(elapsed, 120) / 1000;
        paint();
      }
      raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (disposed || raf || motionQuery.matches) return;
      last = 0;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) start();
          else stop();
        },
        { threshold: 0.01 },
      );
      io.observe(canvas);
    } else {
      visible = true;
      start();
    }

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (visible) {
        last = 0;
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onMotionChange = () => {
      if (motionQuery.matches) {
        stop();
        paint();
      } else {
        start();
      }
    };
    motionQuery.addEventListener("change", onMotionChange);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => syncSize());
      ro.observe(canvas);
    }
    window.addEventListener("resize", syncSize);

    /* Le thème bascule sur <html class="dark"> : on relit la palette */
    const themeObserver = new MutationObserver(() => {
      readPalette();
      paint();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    readPalette();
    syncSize(); // première courbe (statique si reduced-motion)

    return () => {
      disposed = true;
      stop();
      io?.disconnect();
      ro?.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", syncSize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  /* ── Parallaxe au pointeur (transform seulement, ≤ 7 px) ──── */
  useEffect(() => {
    const zone = zoneRef.current;
    const shift = shiftRef.current;
    if (!zone || !shift) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduced.matches) return;

    const MAX = 7;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const tick = () => {
      raf = 0;
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      if (Math.abs(targetX - currentX) < 0.05) currentX = targetX;
      if (Math.abs(targetY - currentY) < 0.05) currentY = targetY;
      shift.style.transform =
        currentX === 0 && currentY === 0 ? "" : `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      if (currentX !== targetX || currentY !== targetY) raf = window.requestAnimationFrame(tick);
    };

    const request = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = zone.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const ny = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
      targetX = nx * 2 * MAX;
      targetY = ny * 2 * MAX;
      request();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      request();
    };

    zone.addEventListener("pointermove", onMove, { passive: true });
    zone.addEventListener("pointerleave", onLeave);

    return () => {
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
      shift.style.transform = "";
    };
  }, []);

  const hardware = domains.hardware.slice(0, 3).map((d) => tr(d)).join(" · ");
  const software = domains.software.slice(0, 3).map((d) => tr(d)).join(" · ");

  return (
    <div ref={zoneRef} className="relative mx-auto w-full max-w-[520px]">
      <div ref={shiftRef} className="relative">
        {/* Halos : chaud en bas à gauche, froid en haut à droite */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-8 z-0 h-44 w-44 rounded-full bg-[rgb(var(--ember)/0.18)] blur-[64px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 z-0 h-44 w-44 rounded-full bg-[rgb(var(--signal)/0.18)] blur-[64px]"
        />

        {/* Dalle unique */}
        <div className="glass relative z-10 overflow-hidden rounded-[32px] p-4 sm:p-5">
          <span
            aria-hidden="true"
            className="tech-grid pointer-events-none absolute inset-0 z-0 opacity-60 [mask-image:radial-gradient(120%_105%_at_50%_0%,black,transparent_74%)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 rounded-[32px] bg-[linear-gradient(140deg,rgb(255_255_255/0.13),transparent_38%,transparent_72%,rgb(255_255_255/0.05))]"
          />

          <div className="relative z-10">
            {/* En-tête */}
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg/60">Instrument · W-HKR</p>
              <span aria-hidden="true" className="relative grid size-3 shrink-0 place-items-center">
                <span className="absolute inset-0 rounded-full bg-ember/20 blur-[2px]" />
                <span className="size-1.5 animate-pulseDot rounded-full bg-ember shadow-[0_0_8px_rgb(var(--ember)/0.75)]" />
              </span>
            </div>

            {/* Oscilloscope */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.07)]">
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="block h-[120px] w-full [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
              />
            </div>

            {/* Lectures instrument */}
            <div className="mt-4 space-y-3">
              <Readout tone="ember" label={tr(copy.common.hardware)} value={hardware} />
              <Readout tone="signal" label={tr(copy.common.software)} value={software} />
            </div>

            {/* Pied : le programme réel */}
            <div className="mt-4 border-t border-[rgb(var(--line)/0.08)] pt-3">
              <p className="font-mono text-[10px] leading-relaxed tracking-[0.04em] text-muted">
                {tr(copy.about.degree)}
              </p>
            </div>
          </div>
        </div>

        {/* Étiquette flottante, à cheval sur le bord supérieur */}
        <div className="glass pointer-events-none absolute -top-4 left-6 z-20 flex items-center gap-2 rounded-full px-2.5 py-1 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.9)]">
          <Icon name="link" className="size-3 text-fg/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg/80">data flow</span>
        </div>
      </div>
    </div>
  );
}
