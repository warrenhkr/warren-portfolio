"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { nav, site } from "@/content/site";
import { Icon } from "./Icon";
import { Container } from "./ui";

export function Footer() {
  const { tr } = useLang();
  const f = copy.footer;
  const heading = "mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted";

  return (
    <footer className="relative mt-24 overflow-hidden">
      <Container>
        <div className="hairline" />
        <div className="grid gap-12 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="display text-2xl font-bold">{site.name}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ember">Hardware × Software</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">{tr(f.identity)}</p>
          </div>

          <div>
            <p className={heading}>{tr(f.navigation)}</p>
            <ul className="space-y-2.5 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-muted transition hover:text-fg">
                    {tr(n.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>{tr(f.socials)}</p>
            <ul className="space-y-2.5 text-sm">
              {site.socials.map((s) => (
                <li key={s.id}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted transition hover:text-fg">
                      {s.label}
                      <Icon name="external" className="size-3.5 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-muted italic">
                      {s.label} · {tr(copy.contact.socialTodo)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>{tr(copy.footer.contact)}</p>
            {site.email ? (
              <a href={`mailto:${site.email}`} className="text-sm text-muted transition hover:text-fg">
                {site.email}
              </a>
            ) : (
              <p className="text-sm italic text-muted">{tr(copy.contact.emailTodo)}</p>
            )}
            <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ember">
              {tr(copy.common.contactMe)}
              <Icon name="arrow" className="size-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[rgb(var(--line)/0.08)] py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {tr(f.rights)}
          </p>
          <p className="normal-case tracking-normal">{tr(f.credit)}</p>
          <a href="#main" className="inline-flex items-center gap-1.5 transition hover:text-fg">
            <Icon name="up" className="size-3.5" />
            {tr(copy.common.top)}
          </a>
        </div>
      </Container>

      <p
        aria-hidden="true"
        className="pointer-events-none select-none whitespace-nowrap text-center font-heading text-[19vw] font-bold leading-[0.72] text-[rgb(var(--line)/0.045)]"
      >
        WARREN
      </p>
    </footer>
  );
}
