"use client";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { site } from "@/content/site";
import { GlassCard, IconTile, PageHero, Reveal, Section, Slot } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { BrandLogo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export function ContactView() {
  const { tr } = useLang();
  const c = copy.contact;

  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} text={c.text} current={c.seo} />

      <Section>
        <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <ContactForm />
          </Reveal>

          <div className="space-y-5">
            <Reveal delay={80}>
              <GlassCard tone="neutral" className="p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <IconTile name="mail" tone="neutral" />
                  <p className="mono-label !mb-0">{tr(c.details)}</p>
                </div>
                <div className="mt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{tr(c.email)}</p>
                  {site.email ? (
                    <a href={`mailto:${site.email}`} className="mt-1 inline-block font-heading text-lg font-semibold transition hover:text-ember">
                      {site.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted">{tr(c.emailTodo)}</p>
                  )}
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delay={140}>
              <GlassCard tone="neutral" className="p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <p className="mono-label !mb-0">{tr(c.socials)}</p>
                  <Icon name="link" className="size-4 text-muted" />
                </div>
                <ul className="mt-5 space-y-2">
                  {site.socials.map((s) =>
                    s.url ? (
                      <li key={s.id}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.1)] px-4 py-3 transition hover:border-[rgb(var(--line)/0.22)]"
                        >
                          <BrandLogo icon={s.id} name={s.label} className="size-5" />
                          <span className="text-sm font-medium">{s.label}</span>
                          <Icon name="external" className="ml-auto size-3.5 text-muted" />
                        </a>
                      </li>
                    ) : (
                      <li key={s.id}>
                        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[rgb(var(--line)/0.16)] px-4 py-3">
                          <BrandLogo icon={s.id} name={s.label} className="size-5 opacity-50" />
                          <span className="text-sm text-muted">
                            {s.label} · {tr(c.socialTodo)}
                          </span>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </GlassCard>
            </Reveal>

            <Reveal delay={200}>
              <Slot label={tr(copy.common.soon)}>{tr(c.emailTodo)}</Slot>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
