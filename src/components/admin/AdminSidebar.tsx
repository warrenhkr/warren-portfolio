"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import type { AdminModuleGroup } from "@/lib/admin/modules";

/** État de session affiché en bas du rail : fourni par le layout (serveur), jamais deviné côté client. */
export type AdminSession = { label: string; detail: string; tone?: "ok" | "warn" };

const DRAWER_ID = "admin-drawer";

/* Verre dépoli : jetons de admin.css (--adm-glass / --adm-glass-a), donc clair ↔ sombre automatique. */
const GLASS = { backgroundColor: "rgb(var(--adm-glass) / var(--adm-glass-a))" } as const;

/* ------------------------------------------------------------------ */
/* Briques partagées                                                   */
/* ------------------------------------------------------------------ */

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold tracking-wide"
        style={{ backgroundColor: "rgb(var(--fg))", color: "rgb(var(--bg))" }}
      >
        WH
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold text-fg">Administration</span>
        {!compact && <span className="block truncate text-[11px] text-muted">Portfolio</span>}
      </span>
    </span>
  );
}

function NavList({ groups, onNavigate }: { groups: AdminModuleGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav aria-label="Administration" className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((module) => {
              const active = isActive(module.href);
              if (module.status === "ready") {
                return (
                  <li key={module.id}>
                    <Link
                      href={module.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        active ? "bg-accent/12 font-medium text-fg" : "text-fg/80 hover:bg-surface2 hover:text-fg"
                      }`}
                    >
                      {active && (
                        <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" />
                      )}
                      <Icon name={module.icon} className={`size-4 shrink-0 ${active ? "text-accent" : "text-muted"}`} />
                      <span className="truncate">{module.label}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={module.id}>
                  <span
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted"
                  >
                    <Icon name={module.icon} className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">{module.label}</span>
                    <span className="adm-badge ml-auto shrink-0" data-tone="neutral" data-plain="">
                      Bientôt
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SideFooter({ session }: { session: AdminSession }) {
  return (
    <div className="mt-auto space-y-2 border-t border-line p-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg/80 transition-colors hover:bg-surface2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Icon name="external" className="size-4 shrink-0" />
        Voir le site
        <span className="sr-only">(nouvel onglet)</span>
      </a>
      <div className="rounded-lg border border-line bg-surface p-3">
        <span className="adm-badge" data-tone={session.tone === "warn" ? "warn" : "ok"}>
          {session.label}
        </span>
        <p className="mt-1.5 text-[11px] leading-snug text-muted">{session.detail}</p>
        <form action="/api/admin/logout" method="post" className="mt-2.5">
          <button
            type="submit"
            className="w-full rounded-md border border-line px-2.5 py-1.5 text-[11px] font-medium text-fg/80 transition-colors hover:bg-surface2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rail desktop (verre dépoli)                                         */
/* ------------------------------------------------------------------ */

export function AdminSidebar({ groups, session }: { groups: AdminModuleGroup[]; session: AdminSession }) {
  return (
    <aside
      style={GLASS}
      className="sticky top-0 hidden h-screen flex-col border-r border-line backdrop-blur-xl lg:flex"
    >
      <div className="px-5 py-5">
        <Brand />
      </div>
      <NavList groups={groups} />
      <SideFooter session={session} />
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation mobile : bouton + tiroir                                 */
/* ------------------------------------------------------------------ */

export function AdminMobileNav({ groups, session }: { groups: AdminModuleGroup[]; session: AdminSession }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  /* Navigation : on referme le tiroir quand la route change (clic sur un lien du menu). */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Ouverture : scroll du body bloqué + focus entré dans le tiroir + piège à focus + Échap. */
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);

    const first = focusables()[0];
    (first ?? drawer).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === firstItem || active === drawer)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  /* Fermeture : le focus revient sur le bouton déclencheur. */
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        aria-label={open ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation"}
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg transition-colors hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Icon name={open ? "x" : "menu"} className="size-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={close}
              className="absolute inset-0 size-full cursor-default bg-black/50 backdrop-blur-[2px]"
            />
            <div
              id={DRAWER_ID}
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation de l'administration"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex w-[min(84vw,19.5rem)] flex-col border-r border-line bg-bg shadow-2xl outline-none"
            >
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
                <Brand />
                <button
                  type="button"
                  aria-label="Fermer le menu de navigation"
                  onClick={close}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-fg/80 transition-colors hover:bg-surface2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon name="x" className="size-5" />
                </button>
              </div>
              <NavList groups={groups} onNavigate={close} />
              <SideFooter session={session} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
