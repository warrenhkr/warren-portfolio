"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { copy } from "@/content/copy";
import { nav, site } from "@/content/site";
import { Icon } from "./Icon";
import { btn, cn } from "./ui";

const ICONS: Record<string, string> = {
  "/": "home",
  "/about": "user",
  "/projects": "grid",
  "/lab": "flask",
  "/skills": "award",
  "/stack": "layers",
  "/ai-workspace": "bot",
  "/contact": "mail",
};

function useIsActive() {
  const pathname = usePathname() ?? "/";
  // Un `pathname.startsWith(href)` nu marque `/projects-beta` comme actif pour
  // `/projects`. On n'accepte que l'égalité exacte ou un vrai sous-chemin
  // (`/projects/[slug]`), pour que `aria-current="page"` ne soit posé qu'une fois.
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/* ── Contrôles partagés ──────────────────────────────────────── */

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, tr } = useLang();
  return (
    <div
      role="group"
      aria-label={tr(copy.common.language)}
      className={cn("flex items-center rounded-full border border-[rgb(var(--line)/0.12)] p-0.5", compact && "text-[10px]")}
    >
      {(["fr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={code === "fr" ? "Français" : "English"}
          lang={code}
          className={cn(
            "rounded-full font-mono uppercase tracking-wider transition",
            compact ? "px-2 py-1" : "px-2.5 py-1 text-[11px]",
            lang === code ? "bg-fg text-bg" : "text-muted hover:text-fg",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme();
  const { tr } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={tr(copy.common.theme)}
      title={tr(copy.common.theme)}
      className={cn(
        "flex items-center gap-3 rounded-2xl text-muted transition hover:text-fg",
        withLabel ? "px-3 py-2.5" : "grid size-9 place-items-center",
      )}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px] shrink-0" />
      {withLabel && <span className="whitespace-nowrap text-sm opacity-0 transition-opacity duration-300 group-hover/side:opacity-100">{tr(copy.common.theme)}</span>}
    </button>
  );
}

/** Barre de progression de lecture, discrète, en haut de page. */
export function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setW(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[78] h-[2px]">
      <div
        className="h-full origin-left bg-[linear-gradient(90deg,rgb(var(--ember)),rgb(var(--signal)))] transition-[width] duration-150 ease-out"
        style={{ width: `${w * 100}%` }}
      />
    </div>
  );
}

/* ── Rail flottant (bureau ≥ 1280px) ─────────────────────────── */

export function SideRail() {
  const { tr } = useLang();
  const isActive = useIsActive();

  return (
    <aside
      aria-label={tr(copy.common.nav)}
      className="group/side glass-strong fixed bottom-4 left-4 top-4 z-[70] hidden w-[78px] flex-col overflow-hidden rounded-[26px] px-3 py-5 transition-[width] duration-500 ease-out hover:w-[250px] focus-within:w-[250px] xl:flex"
    >
      <Link href="/" className="flex items-center gap-3 rounded-2xl px-1.5" aria-label={site.name}>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#C45A00,#1A3BCC)] font-heading text-[13px] font-bold text-white shadow-ember">
          WH
        </span>
        <span className="min-w-0 opacity-0 transition-opacity duration-300 group-hover/side:opacity-100">
          <span className="block whitespace-nowrap font-heading text-[13px] font-semibold leading-tight">{site.name}</span>
          <span className="block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-muted">warren_hkr</span>
        </span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {nav.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              aria-label={tr(n.label)}
              title={tr(n.label)}
              className={cn(
                "group/item relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                active ? "bg-[rgb(var(--fg)/0.08)] text-fg" : "text-muted hover:bg-[rgb(var(--fg)/0.05)] hover:text-fg",
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,rgb(var(--ember)),rgb(var(--signal)))]"
                />
              )}
              <Icon name={ICONS[n.href] ?? "grid"} className={cn("size-[18px] shrink-0 transition", active && "text-ember")} />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/side:opacity-100">{tr(n.label)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1">
        <ThemeToggle withLabel />
        <div className="flex items-center justify-center px-0.5 py-1">
          <LangSwitch compact />
        </div>
      </div>
    </aside>
  );
}

/* ── Barre + feuille mobile (< 1280px) ──────────────────────── */

export function MobileBar() {
  const { tr } = useLang();
  const isActive = useIsActive();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => setOpen(false), [pathname]);

  // Si la fenêtre repasse en bureau (≥ 1280px) la feuille n'est plus rendue :
  // on la ferme pour ne pas laisser un piège à focus sur un panneau invisible.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Ouverture : verrou de scroll, fond inerte, focus dans le panneau,
  // piège à focus (Tab / Shift+Tab) et fermeture par Échap.
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;
    // Le conteneur de défilement est <html>, pas <body> : bloquer uniquement
    // body laissait la page défiler. On verrouille les deux et on restaure
    // exactement les valeurs précédentes.
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    // Le fond est neutralisé avec `inert` : ni atteignable au clavier, ni exposé
    // aux technologies d'assistance. La feuille n'est pas un portail React, elle
    // vit hors de ces trois conteneurs, donc rien de son contenu n'est neutralisé.
    const background = [
      document.getElementById("main"),
      document.getElementById("mobile-topbar"),
      document.querySelector("footer"),
    ].filter((el): el is HTMLElement => Boolean(el));
    background.forEach((el) => el.setAttribute("inert", ""));

    const focusables = (): HTMLElement[] => {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.getClientRects().length > 0);
    };

    (focusables()[0] ?? panelRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const active = document.activeElement;
      const inside = panelRef.current?.contains(active ?? null) ?? false;
      if (!inside) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
        return;
      }
      const edge = e.shiftKey ? items[0] : items[items.length - 1];
      if (active === edge) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      background.forEach((el) => el.removeAttribute("inert"));
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  // Fermeture : le focus revient au bouton d'ouverture, une fois le panneau
  // démonté et le fond réactivé (sinon le focus atterrirait sur un nœud inerte).
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    triggerRef.current?.focus();
  }, [open]);

  return (
    <>
      <div id="mobile-topbar" className="fixed inset-x-0 top-0 z-[70] xl:hidden">
        <div className="glass-strong mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl px-3 py-2">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={site.name}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#C45A00,#1A3BCC)] font-heading text-[11px] font-bold text-white">
              WH
            </span>
            <span className="truncate font-heading text-[11px] font-semibold leading-tight sm:text-[13px]">
              {site.name}
              <span className="hidden font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-muted sm:block">warren_hkr</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LangSwitch compact />
            <ThemeToggle />
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-haspopup="dialog"
              aria-label={tr(copy.common.menu)}
              className="ml-1 grid size-9 place-items-center rounded-xl border border-[rgb(var(--line)/0.12)] text-fg"
            >
              <Icon name="menu" className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={tr(copy.common.nav)}
          tabIndex={-1}
          className="fixed inset-0 z-[85] outline-none xl:hidden"
        >
          <div className="absolute inset-0 bg-[rgb(var(--bg)/0.9)] backdrop-blur-3xl" onClick={() => setOpen(false)} />
          <div className="page-enter relative flex h-full flex-col px-5 pb-8 pt-6">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{tr(copy.common.nav)}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={tr(copy.common.close)}
                className="grid size-10 place-items-center rounded-full border border-[rgb(var(--line)/0.14)] text-fg"
              >
                <Icon name="x" className="size-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-1">
              {nav.map((n, i) => {
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-3 py-3.5 transition",
                      active ? "bg-[rgb(var(--fg)/0.07)] text-fg" : "text-muted",
                    )}
                  >
                    <span className="font-mono text-[10px] tabular-nums opacity-60">0{i + 1}</span>
                    <span className="font-heading text-[22px] font-semibold leading-none">{tr(n.label)}</span>
                    <Icon name="arrow" className={cn("ml-auto size-4", active ? "text-ember" : "opacity-40")} />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 flex flex-col gap-4">
              <Link href="/contact" className={cn(btn("ember"), "w-full")} onClick={() => setOpen(false)}>
                {tr(copy.common.contactMe)}
                <Icon name="arrow" className="size-4" />
              </Link>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {site.email || tr(copy.contact.emailTodo)}
                </span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
