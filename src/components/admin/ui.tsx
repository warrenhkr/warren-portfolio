import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/* ─────────────────────────────────────────────────────────────
   KIT UI ADMIN — « Forge & Signal », version outil de travail.
   Console d'édition : dense, lisible, verre dépoli discret.

   Ce module reste un Server Component : aucun hook, aucun état React.
   Les deux contrôles interactifs (TabsSimple, Toggle) s'appuient sur des
   contrôles natifs (radio / checkbox) pilotés en CSS via `peer-*` :
   ils fonctionnent sans JavaScript, restent accessibles au clavier et
   sont soumis avec le formulaire — ce qu'un CRUD attend justement.
   ───────────────────────────────────────────────────────────── */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ══════════════════════════════════════════════════════════════
   STRUCTURE
   ══════════════════════════════════════════════════════════════ */

export type PageHeaderProps = {
  title: ReactNode;
  description?: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, meta, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cx(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export type PanelTone = "solid" | "glass" | "quiet";

export type PanelProps = {
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  /** Actions de l'en-tête (boutons, filtres, menu). */
  actions?: ReactNode;
  /** Alias historique de `actions`, conservé pour ne rien casser. */
  aside?: ReactNode;
  footer?: ReactNode;
  tone?: PanelTone;
  padded?: boolean;
  className?: string;
};

const PANEL_TONE: Record<PanelTone, string> = {
  solid: "border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
  glass: "border-line/70 bg-surface/75 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_1px_2px_rgba(16,24,40,0.05)]",
  quiet: "border-line/70 bg-surface2",
};

export function Panel({
  title,
  description,
  children,
  actions,
  aside,
  footer,
  tone = "solid",
  padded = true,
  className,
}: PanelProps) {
  const headerActions = actions ?? aside;
  const hasHeader = Boolean(title || description || headerActions);
  return (
    <section className={cx("overflow-hidden rounded-xl border", PANEL_TONE[tone], className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-[13px] font-semibold uppercase tracking-[0.08em] text-fg">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-xs text-muted">{description}</p>}
          </div>
          {headerActions && <div className="flex shrink-0 items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : undefined}>{children}</div>
      {footer && (
        <div className="border-t border-line bg-surface2/60 px-4 py-2.5 text-xs text-muted sm:px-5">
          {footer}
        </div>
      )}
    </section>
  );
}

export function StatusDot({
  tone,
  label,
  className,
}: {
  tone: "ok" | "warn" | "error";
  label?: string;
  className?: string;
}) {
  const color = {
    ok: "bg-[rgb(var(--ok))]",
    warn: "bg-[rgb(var(--warn))]",
    error: "bg-[rgb(var(--danger))]",
  }[tone];
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden="true" className={cx("inline-block size-2 rounded-full", color)} />
      {label && <span className="text-xs text-muted">{label}</span>}
    </span>
  );
}

export type EmptyStateProps = {
  title: string;
  text: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  /** Sans cadre : à insérer dans un conteneur qui a déjà bordure et fond. */
  bare?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  text,
  action,
  icon,
  compact,
  bare,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        bare
          ? "text-center"
          : cx(
              "rounded-xl border border-dashed border-line bg-surface text-center",
              compact ? "px-5 py-6" : "px-6 py-12",
            ),
        className,
      )}
    >
      {icon && <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-lg bg-surface2 text-muted">{icon}</div>}
      <p className="text-[13px] font-semibold text-fg">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STATUTS & MESURES
   ══════════════════════════════════════════════════════════════ */

export type BadgeTone =
  | "published"
  | "draft"
  | "archived"
  | "scheduled"
  | "ok"
  | "warn"
  | "danger"
  | "info"
  | "neutral";

export const STATUS_LABELS = {
  published: "Publié",
  draft: "Brouillon",
  archived: "Archivé",
  scheduled: "À publier",
} as const;

const BADGE_TONE: Record<BadgeTone, "ok" | "warn" | "danger" | "info" | "neutral"> = {
  published: "ok",
  draft: "warn",
  archived: "neutral",
  scheduled: "info",
  ok: "ok",
  warn: "warn",
  danger: "danger",
  info: "info",
  neutral: "neutral",
};

export type BadgeProps = {
  tone?: BadgeTone;
  children?: ReactNode;
  /** Masque la pastille de tête. */
  plain?: boolean;
  className?: string;
};

export function Badge({ tone = "neutral", children, plain, className }: BadgeProps) {
  const label =
    children ??
    (tone in STATUS_LABELS ? STATUS_LABELS[tone as keyof typeof STATUS_LABELS] : tone);
  return (
    <span
      className={cx("adm-badge", className)}
      data-tone={BADGE_TONE[tone]}
      data-plain={plain ? "" : undefined}
    >
      {label}
    </span>
  );
}

export type StatDelta = {
  label: string;
  direction?: "up" | "down" | "flat";
  intent?: "ok" | "warn" | "danger" | "neutral";
};

export type StatTileProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  icon?: ReactNode;
  delta?: StatDelta;
  footer?: ReactNode;
  tone?: "solid" | "glass" | "quiet";
  className?: string;
};

const DELTA_GLYPH = { up: "↑", down: "↓", flat: "→" } as const;
const DELTA_CLASS = {
  ok: "text-[rgb(var(--ok-ink))] bg-[rgb(var(--ok))]/[0.12]",
  warn: "text-[rgb(var(--warn-ink))] bg-[rgb(var(--warn))]/[0.14]",
  danger: "text-[rgb(var(--danger-ink))] bg-[rgb(var(--danger))]/[0.12]",
  neutral: "text-[rgb(var(--neutral-ink))] bg-[rgb(var(--neutral))]/[0.12]",
} as const;

export function StatTile({
  label,
  value,
  unit,
  hint,
  icon,
  delta,
  footer,
  tone = "solid",
  className,
}: StatTileProps) {
  return (
    <div className={cx("rounded-xl border p-4", PANEL_TONE[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {icon && (
          <span aria-hidden="true" className="shrink-0 text-muted">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-fg tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-muted">{unit}</span>}
      </div>
      {(delta || hint) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {delta && (
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                DELTA_CLASS[delta.intent ?? "neutral"],
              )}
            >
              <span aria-hidden="true">{DELTA_GLYPH[delta.direction ?? "flat"]}</span>
              {delta.label}
            </span>
          )}
          {hint && <span className="text-[11px] leading-relaxed text-muted">{hint}</span>}
        </div>
      )}
      {footer && <div className="mt-3 border-t border-line pt-2.5 text-[11px] text-muted">{footer}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TABLE DE DONNÉES
   ══════════════════════════════════════════════════════════════ */

export type ColumnAlign = "left" | "center" | "right";

export type DataColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: ColumnAlign;
  width?: string;
  className?: string;
  headerClassName?: string;
  /** Masque la colonne sous ce palier (utile en mobile). */
  hideBelow?: "sm" | "md" | "lg";
};

const ALIGN: Record<ColumnAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const HIDE: Record<"sm" | "md" | "lg", string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export type DataTableProps<T> = {
  columns: Array<DataColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  caption?: string;
  dense?: boolean;
  loading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  footer?: ReactNode;
  stickyHeader?: boolean;
  rowClassName?: (row: T, index: number) => string | undefined;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  dense = true,
  loading = false,
  skeletonRows = 5,
  empty,
  footer,
  stickyHeader = true,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const headPad = dense ? "px-3 py-2" : "px-4 py-3";
  const cellPad = dense ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className={cx("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line bg-surface2">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cx(
                    headPad,
                    "whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-muted",
                    ALIGN[col.align ?? "left"],
                    col.hideBelow && HIDE[col.hideBelow],
                    stickyHeader && "sticky top-0 z-10 bg-surface2",
                    col.headerClassName,
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`adm-skel-${i}`}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cx(cellPad, col.hideBelow && HIDE[col.hideBelow])}
                      >
                        <span
                          aria-hidden="true"
                          className="adm-skel block h-3"
                          style={{ width: `${45 + ((i * 7 + col.key.length * 13) % 45)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-10 text-center text-[13px] text-muted"
                      >
                        {empty ?? "Aucune ligne à afficher."}
                      </td>
                    </tr>
                  )
                : rows.map((row, index) => (
                    <tr
                      key={getRowKey(row, index)}
                      className={cx(
                        "transition-colors hover:bg-surface2/70",
                        rowClassName?.(row, index),
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cx(
                            cellPad,
                            ALIGN[col.align ?? "left"],
                            col.hideBelow && HIDE[col.hideBelow],
                            col.className,
                          )}
                        >
                          {col.cell(row, index)}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t border-line bg-surface2/60">
                <td colSpan={columns.length} className="px-3 py-2 text-[11px] text-muted">
                  {footer}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {loading && <span className="sr-only" role="status" aria-live="polite">Chargement des données…</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BARRE D'OUTILS
   ══════════════════════════════════════════════════════════════ */

export type ToolbarProps = {
  searchName?: string;
  searchPlaceholder?: string;
  searchLabel?: string;
  searchDefaultValue?: string;
  /** Emplacements de filtres (Select, puces, date…). */
  filters?: ReactNode;
  /** Vues secondaires (segments de statut). */
  views?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  className?: string;
};

export function Toolbar({
  searchName = "q",
  searchPlaceholder = "Rechercher…",
  searchLabel = "Rechercher",
  searchDefaultValue,
  filters,
  views,
  primary,
  secondary,
  className,
}: ToolbarProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 border-b border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-64">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
          >
            <circle cx="8.5" cy="8.5" r="5.25" />
            <path d="m12.5 12.5 4 4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name={searchName}
            aria-label={searchLabel}
            placeholder={searchPlaceholder}
            defaultValue={searchDefaultValue}
            className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-[13px] text-fg outline-none transition-colors placeholder:text-muted/70 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]"
          />
        </div>
        {filters}
        {views}
      </div>
      {(primary || secondary) && (
        <div className="flex shrink-0 items-center gap-2">
          {secondary}
          {primary}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BOUTONS
   ══════════════════════════════════════════════════════════════ */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
};

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[rgb(var(--btn))] text-[rgb(var(--btn-ink))] shadow-sm hover:bg-[rgb(var(--btn-hover))]",
  secondary: "border border-line bg-surface text-fg hover:bg-surface2",
  ghost: "border border-transparent text-muted hover:bg-surface2 hover:text-fg",
  danger:
    "border border-transparent bg-[rgb(var(--danger-btn))] text-[rgb(var(--danger-btn-ink))] shadow-sm hover:bg-[rgb(var(--danger-btn-hover))]",
};

export function Button({
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  block,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]",
        block && "w-full",
        BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {iconLeft && <span aria-hidden="true" className="shrink-0">{iconLeft}</span>}
      {children}
      {iconRight && <span aria-hidden="true" className="shrink-0">{iconRight}</span>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORMULAIRES
   ══════════════════════════════════════════════════════════════ */

const FIELD_BASE =
  "w-full rounded-lg border bg-surface text-[13px] text-fg outline-none transition-colors placeholder:text-muted/70 disabled:cursor-not-allowed disabled:opacity-60";

const FIELD_OK =
  "border-line focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]";

const FIELD_ERR =
  "border-[rgb(var(--danger))]/60 focus:border-[rgb(var(--danger))] focus:ring-2 focus:ring-[rgb(var(--danger))]/[0.18]";

export type FieldControlProps = {
  id: string;
  invalid: boolean;
  "aria-describedby"?: string;
};

export type FieldProps = {
  /** Doit correspondre à l'`id` du contrôle (htmlFor correct). */
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  aside?: ReactNode;
  className?: string;
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
};

export function Field({
  id,
  label,
  description,
  error,
  required,
  aside,
  className,
  children,
}: FieldProps) {
  const descId = description ? `${id}-description` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;
  const control: FieldControlProps = {
    id,
    invalid: Boolean(error),
    "aria-describedby": describedBy,
  };

  return (
    <div className={cx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-medium text-fg">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-[rgb(var(--danger-ink))]">
              *
            </span>
          )}
          {required && <span className="sr-only"> (obligatoire)</span>}
        </label>
        {aside}
      </div>
      {typeof children === "function" ? children(control) : children}
      {description && (
        <p id={descId} className="text-[11px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {error && (
        <p
          id={errId}
          className="flex items-start gap-1 text-[11px] font-medium leading-relaxed text-[rgb(var(--danger-ink))]"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  invalid?: boolean;
};

export function TextInput({ id, invalid, className, ...rest }: TextInputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      className={cx(FIELD_BASE, invalid ? FIELD_ERR : FIELD_OK, "h-9 px-3", className)}
      {...rest}
    />
  );
}

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  id: string;
  invalid?: boolean;
};

export function TextArea({ id, invalid, className, rows = 4, ...rest }: TextAreaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cx(FIELD_BASE, invalid ? FIELD_ERR : FIELD_OK, "resize-y px-3 py-2 leading-relaxed", className)}
      {...rest}
    />
  );
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id: string;
  invalid?: boolean;
};

export function Select({ id, invalid, className, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={invalid || undefined}
        className={cx(
          FIELD_BASE,
          invalid ? FIELD_ERR : FIELD_OK,
          "h-9 appearance-none pl-3 pr-8",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
      >
        <path d="m5.5 8 4.5 4.5L14.5 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export type ToggleProps = {
  id: string;
  label: string;
  name?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Toggle({
  id,
  label,
  name,
  description,
  checked,
  defaultChecked,
  disabled,
  className,
}: ToggleProps) {
  const descId = description ? `${id}-description` : undefined;
  const stateProps = checked === undefined ? { defaultChecked: Boolean(defaultChecked) } : { checked };

  return (
    <label
      htmlFor={id}
      className={cx("flex items-start gap-3", disabled && "opacity-60", className)}
    >
      <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          disabled={disabled}
          aria-describedby={descId}
          className="peer sr-only"
          {...stateProps}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-line bg-surface2 transition-colors peer-checked:border-[rgb(var(--btn))] peer-checked:bg-[rgb(var(--btn))] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgb(var(--accent))] peer-disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium leading-snug text-fg">{label}</span>
        {description && (
          <span id={descId} className="mt-0.5 block text-[11px] leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/* ══════════════════════════════════════════════════════════════
   ONGLETS (FR / EN)
   Segmented control natif : radios + CSS, donc soumis avec le formulaire.
   ══════════════════════════════════════════════════════════════ */

export type TabItem = {
  id: string;
  label: string;
  badge?: ReactNode;
};

export type TabsSimpleProps = {
  items: TabItem[];
  /** `name` du groupe radio : la valeur choisie est soumise. */
  name: string;
  defaultValue?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function TabsSimple({
  items,
  name,
  defaultValue,
  label,
  size = "md",
  className,
}: TabsSimpleProps) {
  const active = defaultValue ?? items[0]?.id;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface2 p-0.5",
        className,
      )}
    >
      {items.map((item) => (
        <label key={item.id} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={item.id}
            defaultChecked={item.id === active}
            className="peer sr-only"
          />
          <span
            className={cx(
              "flex items-center justify-center rounded-[7px] font-medium text-muted transition-colors",
              "hover:text-fg peer-checked:bg-surface peer-checked:text-fg peer-checked:shadow-sm",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-[rgb(var(--accent))]",
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
            )}
          >
            {item.label}
            {item.badge != null && (
              <span className="ml-1.5 text-[10px] tabular-nums text-muted">{item.badge}</span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

/* Squelette isolé, utile hors DataTable. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("adm-skel block h-3", className)} />;
}
