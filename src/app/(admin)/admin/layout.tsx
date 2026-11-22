import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
import { requireAdmin } from "@/lib/auth/guard";
import { adminGroups } from "@/lib/admin/modules";
import { AdminSidebar, AdminMobileNav, type AdminSession } from "@/components/admin/AdminSidebar";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: { absolute: "Administration" },
  robots: { index: false, follow: false, nocache: true },
};

/** Même verre dépoli que le rail : jetons de admin.css, donc identique en clair et en sombre. */
const GLASS = { backgroundColor: "rgb(var(--adm-glass) / var(--adm-glass-a))" } as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Vraie garde : session en base + second facteur. Sans session valide → redirection vers /admin/login.
  const admin = await requireAdmin();

  const session: AdminSession = { label: "Session administrateur", detail: admin.email, tone: "ok" };

  return (
    <div data-admin className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Aller au contenu
      </a>

      <AdminSidebar groups={adminGroups} session={session} />

      {/* Barre supérieure mobile : même verre que le rail, bouton de tiroir à gauche, sortie vers le site à droite. */}
      <div
        style={GLASS}
        className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line px-3 backdrop-blur-xl lg:hidden"
      >
        <AdminMobileNav groups={adminGroups} session={session} />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">Administration</p>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-fg/80 transition-colors hover:bg-surface2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Voir le site
          <Icon name="external" className="size-3.5" />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </div>

      <main
        id="admin-main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl scroll-mt-16 px-5 py-8 outline-none sm:px-8 lg:px-10 lg:py-10"
      >
        {children}
      </main>
    </div>
  );
}
