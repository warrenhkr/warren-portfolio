"use client";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { aiTools as staticAiTools, type AiTool } from "@/content/ai";
import { cn, GlassCard, PageHero, Reveal, Section, btn } from "@/components/ui";
import { BrandLogo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

const pad = (n: number) => String(n).padStart(2, "0");
const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

/** Statut discret : pastille + libellé léger, pas de badge plein. */
function Status({ usage, className = "" }: { usage: AiTool["usage"]; className?: string }) {
  const { tr } = useLang();
  const label = usage === "regular" ? copy.ai.regular : usage === "experiment" ? copy.ai.experiment : copy.common.confirm;
  return (
    <span className={cn("inline-flex items-center gap-2 text-[11px] leading-none text-muted", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          usage === "regular" && "bg-ember",
          usage === "experiment" && "bg-signal",
          usage === "unconfirmed" && "border border-[rgb(var(--line)/0.55)]",
        )}
      />
      {tr(label)}
    </span>
  );
}

function LogoTodo() {
  const { tr } = useLang();
  return (
    <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
      <Icon name="image" className="size-3.5" />
      {tr(copy.ai.logoTodo)}
    </p>
  );
}

/** Outil mis en avant : premier de la liste, mise en page éditoriale large. */
function Featured({ tool }: { tool: AiTool }) {
  const { tr } = useLang();
  const c = copy.ai;

  return (
    <GlassCard tone="signal" className="relative isolate overflow-hidden p-6 sm:p-9">
      <div className="grid gap-8 lg:grid-cols-[1fr_15rem] lg:gap-12">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 sm:justify-start sm:gap-6">
            <BrandLogo icon={tool.icon} name={tool.name} className="size-11 sm:size-12" />
            <Status usage={tool.usage} />
          </div>

          <h2 className="display mt-6 text-3xl font-bold leading-none sm:text-4xl">{tool.name}</h2>
          <p className="mt-2.5 text-[13px] font-medium text-signal">{tr(tool.role)}</p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{tr(tool.text)}</p>

          {!tool.icon && <LogoTodo />}
        </div>

        <div className="flex flex-col justify-between gap-6 border-t border-[rgb(var(--line)/0.12)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="flex items-center gap-2 font-mono text-[12px] text-muted">
            <Icon name="globe" className="size-3.5 shrink-0 text-muted/70" />
            <span className="truncate">{host(tool.url)}</span>
          </p>
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(btn("signal", "sm"), "w-full sm:w-auto lg:w-full")}
          >
            {tr(c.openTool)}
            <Icon name="external" className="size-3.5" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}

/** Outils secondaires : registre compact, logo, rôle, statut et lien discret. */
function Secondary({ tool }: { tool: AiTool }) {
  const { tr } = useLang();
  const c = copy.ai;

  return (
    <li className="grid grid-cols-[2.5rem_1fr] items-start gap-x-4 gap-y-3 py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:gap-x-6">
      <BrandLogo icon={tool.icon} name={tool.name} className="size-9" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-heading text-lg font-semibold leading-tight">{tool.name}</h3>
          <p className="text-[12px] font-medium text-signal">{tr(tool.role)}</p>
        </div>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">{tr(tool.text)}</p>
        {!tool.icon && <LogoTodo />}
      </div>

      <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 sm:col-start-3 sm:mt-1 sm:flex-col sm:items-end sm:gap-3">
        <Status usage={tool.usage} />
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-signal transition hover:text-fg"
        >
          {tr(c.openTool)}
          <Icon name="external" className="size-3.5" />
        </a>
      </div>
    </li>
  );
}

/** `items` vient du serveur (base CMS, repli sur les fichiers) ; sans prop, contenu statique. */
export function AiView({ items }: { items?: AiTool[] }) {
  const { tr } = useLang();
  const c = copy.ai;
  const tools = items ?? staticAiTools;
  const featured = tools[0];
  const others = tools.slice(1);

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        text={c.text}
        current={c.seo}
        meta={[{ label: c.metaTools, value: pad(tools.length) }]}
      />

      <Section className="pt-14">
        {featured && (
          <Reveal>
            <Featured tool={featured} />
          </Reveal>
        )}

        {others.length > 0 && (
          <Reveal delay={80}>
            <div className="mt-12">
              <div className="flex items-center justify-between border-b border-[rgb(var(--line)/0.14)] pb-3">
                <p className="mono-label">{tr(c.metaTools)}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums text-muted">{pad(others.length)}</p>
              </div>
              <ul className="divide-y divide-[rgb(var(--line)/0.08)]">
                {others.map((t) => (
                  <Secondary key={t.id} tool={t} />
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        <p className="mt-10 flex max-w-2xl items-start gap-3 border-t border-[rgb(var(--line)/0.10)] pt-6 text-[12px] leading-relaxed text-muted">
          <Icon name="plus" className="mt-0.5 size-3.5 shrink-0 text-muted/70" />
          {tr(c.aiToolsNote)}
        </p>
      </Section>
    </>
  );
}
