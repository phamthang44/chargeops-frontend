import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { GlobalSearchType } from '@chargeops/api';
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconCalendar,
  IconClipboardCheck,
  IconLifebuoy,
  IconPin,
  IconSearch,
  IconShieldCheck,
  IconUsers,
  IconX,
} from '@chargeops/ui';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  /** Short mono chip (code / id fragment) rendered next to the title. */
  badge?: string;
  onSelect: () => void;
}

/** One authorized group returned by the console's `load` (see makeGlobalLoad). */
export interface SearchGroupLoad {
  type: GlobalSearchType;
  results: SearchResult[];
}

/** Debounced contract: HeaderSearch calls this with a trimmed query (≥2 chars). */
export type GlobalSearchLoad = (query: string) => Promise<SearchGroupLoad[]>;

/** Fixed glyph per aggregate group — one place to retheme, never per console. */
const GROUP_ICON: Record<GlobalSearchType, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  TICKET: IconLifebuoy,
  STATION: IconPin,
  CHARGER: IconBolt,
  BOOKING: IconCalendar,
  LICENSE: IconShieldCheck,
  APPROVAL: IconClipboardCheck,
  LEGAL_DOCUMENT: IconBook,
  USER: IconUsers,
};

/** Single source of motion truth — real spring-ish curves, never `ease-in-out`. */
const EASE = 'cubic-bezier(0.32,0.72,0,1)';

const ACC = {
  brand: {
    field: 'focus-within:border-brand focus-within:ring-brand/20',
    spinner: 'border-t-brand',
    label: 'border-brand-line bg-brand-faint text-brand',
    rowOn: 'bg-brand-faint',
    rowHover: 'hover:bg-brand-faint',
    icon: 'bg-chip text-muted group-hover:bg-brand-tint group-hover:text-brand-strong',
    iconOn: 'bg-brand-tint text-brand-strong',
    bar: 'bg-brand',
    mark: 'bg-brand-soft text-brand-strong',
    hintIcon: 'bg-brand-faint text-brand',
    arrowOn: 'text-brand',
  },
  owner: {
    field: 'focus-within:border-owner focus-within:ring-owner/20',
    spinner: 'border-t-owner',
    label: 'border-owner-border bg-owner-soft text-owner-deep',
    rowOn: 'bg-owner-soft',
    rowHover: 'hover:bg-owner-soft',
    icon: 'bg-chip text-muted group-hover:bg-owner-tint group-hover:text-owner-deep',
    iconOn: 'bg-owner-tint text-owner-deep',
    bar: 'bg-owner',
    mark: 'bg-owner-soft text-owner-deep',
    hintIcon: 'bg-owner-soft text-owner-deep',
    arrowOn: 'text-owner-deep',
  },
} as const;

type GroupState = { type: GlobalSearchType; label: string; icon?: ReactNode; results: SearchResult[] };

/**
 * Real search — one debounced call into the aggregate `/api/v1/search`
 * endpoint through the console's `load` (makeGlobalLoad adapts the
 * SearchService and attaches each console's navigation targets). Groups are
 * scoped by role server-side and arrive labeled + iconed here; anything
 * without a per-item route is dropped by the adapter instead of pretending
 * to deep-link.
 *
 * Shell = "double bezel": a frosted outer tray (blur lives here, never on the
 * scrolling core) wrapping a solid inner surface. Rows stagger in on mount,
 * highlight the matched substring and support full keyboard navigation
 * (⌘K / Ctrl+K focuses the field from anywhere).
 */
export function HeaderSearch({ load, placeholder, accent = 'brand' }: { load: GlobalSearchLoad; placeholder?: string; accent?: 'brand' | 'owner' }) {
  const { t } = useTranslation('ui');
  const acc = ACC[accent];
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<GroupState[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reqId = useRef(0);

  // Debounced fan-out with stale-response guard.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const debounce = setTimeout(async () => {
      let loaded: SearchGroupLoad[];
      try {
        loaded = await load(q);
      } catch {
        if (id !== reqId.current) return;
        setGroups([]);
        setLoading(false);
        return;
      }
      if (id !== reqId.current) return; // a newer keystroke already superseded this request
      setGroups(
        loaded
          .filter((g) => g.results.length > 0)
          .map((g) => {
            const Icon = GROUP_ICON[g.type];
            return {
              type: g.type,
              label: t(`search.types.${g.type}`),
              icon: <Icon size={14} strokeWidth={1.7} />,
              results: g.results,
            };
          }),
      );
      setLoading(false);
    }, 250);
    return () => clearTimeout(debounce);
  }, [query, load, t]);

  // Outside click + Escape close the panel.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ⌘K / Ctrl+K — global command-bar shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Flat navigation model: groups keep their visual order, rows get a stable index.
  const model = useMemo(() => {
    const flat: SearchResult[] = [];
    const shaped = groups.map((g) => ({
      label: g.label,
      icon: g.icon,
      rows: g.results.map((item) => {
        const index = flat.length;
        flat.push(item);
        return { item, index };
      }),
    }));
    return { groups: shaped, flat, total: flat.length };
  }, [groups]);

  useEffect(() => {
    setActive(model.total > 0 ? 0 : -1);
  }, [model]);

  useEffect(() => {
    if (active >= 0) rowRefs.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const trimmed = query.trim();
  const idle = trimmed.length < 2;
  const showSkeleton = loading && model.total === 0;
  const showEmpty = !loading && !idle && model.total === 0;

  const pick = (item: SearchResult) => {
    setOpen(false);
    setQuery('');
    item.onSelect();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && model.total > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % model.total);
    } else if (e.key === 'ArrowUp' && model.total > 0) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? model.total - 1 : a - 1));
    } else if (e.key === 'Enter') {
      const item = model.flat[active];
      if (open && item) {
        e.preventDefault();
        pick(item);
      }
    }
  };

  /** Bolds + tints the matched fragment so the eye lands on the hit instantly. */
  const highlight = (text: string) => {
    if (idle) return text;
    const i = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className={`rounded-[3px] px-[3px] font-semibold ${acc.mark}`}>{text.slice(i, i + trimmed.length)}</mark>
        {text.slice(i + trimmed.length)}
      </>
    );
  };

  const hintRow = (key: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <kbd className="inline-flex h-[17px] min-w-[18px] items-center justify-center rounded-[5px] border border-line bg-chip px-1 font-sans text-[9.5px] font-semibold text-muted">
        {key}
      </kbd>
      {label}
    </span>
  );

  const keyboardFooter = (
    <div className="flex items-center gap-3.5 border-t border-line-3 px-3 pb-1 pt-2 text-[10px] text-faint">
      {hintRow('↑↓', t('search.hintNav'))}
      {hintRow('↵', t('search.hintOpen'))}
      {hintRow('esc', t('search.hintClose'))}
    </div>
  );

  const modKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl ';

  return (
    <div ref={panelRef} className="relative hidden md:block">
      {/* ---- Trigger: outer tray + inner field (double bezel) ---- */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`group flex h-9 w-[264px] cursor-text items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 shadow-[inset_0_1px_2px_rgba(16,17,26,.05)] transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:ring-2 ${acc.field}`}
      >
        {loading ? (
          <span className={`h-[14px] w-[14px] shrink-0 animate-[spin360_.7s_linear_infinite] rounded-full border-[1.5px] border-line ${acc.spinner}`} />
        ) : (
          <IconSearch
            size={15}
            strokeWidth={1.7}
            className="shrink-0 text-faint transition-colors duration-300 group-focus-within:text-ink"
          />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="header-search-panel"
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `hs-opt-${active}` : undefined}
          placeholder={placeholder ?? t('search.placeholder')}
          className="h-full min-w-0 flex-1 border-none bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            aria-label={t('search.clear')}
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-chip text-faint transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-line hover:text-ink active:scale-90"
          >
            <IconX size={10} strokeWidth={2.2} />
          </button>
        ) : (
          <kbd className="hidden shrink-0 items-center rounded-[6px] border border-line bg-chip px-1.5 py-px font-sans text-[9.5px] font-semibold tracking-[0.02em] text-faint lg:inline-flex">
            {modKey}K
          </kbd>
        )}
      </div>

      {/* ---- Panel: frosted tray (blur lives here) around a solid scroll core ---- */}
      {open && (
        <div
          id="header-search-panel"
          role="listbox"
          aria-label={placeholder ?? t('search.placeholder')}
          className="absolute left-0 top-full z-45 mt-2 w-[404px] max-w-[calc(100vw_-_2rem)] rounded-[20px] border border-line bg-surface/85 p-[5px] shadow-[0_1px_2px_rgba(16,17,26,.05),0_28px_64px_-20px_rgba(16,17,26,.25)] backdrop-blur-xl"
          style={{ animation: `dropIn .3s ${EASE}` }}
        >
          <div
            className={`max-h-[min(64vh,460px)] overflow-y-auto overscroll-contain rounded-[15px] bg-surface-2 py-1.5 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line ${
              loading && model.total > 0 ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {idle ? (
              <div className="flex flex-col items-center gap-2.5 px-6 py-8 text-center">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${acc.hintIcon}`}>
                  <IconSearch size={16} strokeWidth={1.6} />
                </span>
                <p className="max-w-[220px] text-[12px] leading-relaxed text-muted">{t('search.minChars')}</p>
              </div>
            ) : showSkeleton ? (
              <div className="p-1.5" role="status" aria-live="polite">
                <span className="sr-only">{t('search.loading')}</span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="mb-1 flex items-center gap-3 rounded-[12px] px-2.5 py-2 last:mb-0"
                    style={{ animation: `riseIn .5s ${EASE} both`, animationDelay: `${i * 45}ms` }}
                  >
                    <span className="h-8 w-8 shrink-0 rounded-full bg-chip" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-2.5 w-[55%] rounded-full bg-chip" />
                      <span className="block h-2 w-[35%] rounded-full bg-chip" />
                    </span>
                  </div>
                ))}
              </div>
            ) : showEmpty ? (
              <div className="flex flex-col items-center gap-2.5 px-6 py-8 text-center">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${acc.hintIcon}`}>
                  <IconSearch size={16} strokeWidth={1.6} />
                </span>
                <p className="text-[12px] text-muted">{t('search.empty')}</p>
              </div>
            ) : (
              <>
                {model.groups.map((g, gi) => (
                  <div key={g.type} className={gi > 0 ? 'mt-1 border-t border-line-3 pt-1' : ''}>
                    <div className="px-2.5 pb-1 pt-1.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-[2px] text-[9.5px] font-bold uppercase tracking-[0.18em] ${acc.label}`}
                      >
                        {g.label}
                      </span>
                    </div>
                    {g.rows.map(({ item, index }) => {
                      const on = active === index;
                      return (
                        <button
                          key={item.id}
                          id={`hs-opt-${index}`}
                          ref={(el) => {
                            rowRefs.current[index] = el;
                          }}
                          role="option"
                          aria-selected={on}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => pick(item)}
                          style={{ animation: `riseIn .45s ${EASE} both`, animationDelay: `${Math.min(index, 8) * 32}ms` }}
                          className={`group relative flex w-full items-center gap-3 rounded-[12px] py-2 pl-3 pr-2 text-left transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            on ? acc.rowOn : acc.rowHover
                          }`}
                        >
                          <span
                            className={`absolute left-1 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${acc.bar} ${
                              on ? 'scale-y-100' : 'scale-y-0'
                            }`}
                          />
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px group-hover:scale-105 ${
                              on ? acc.iconOn : acc.icon
                            }`}
                          >
                            {g.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-medium text-ink">{highlight(item.title)}</span>
                              {item.badge && (
                                <span className="shrink-0 rounded-[5px] bg-chip px-1.5 py-px font-mono text-[10px] tracking-tight text-faint">
                                  {highlight(item.badge)}
                                </span>
                              )}
                            </span>
                            {item.subtitle && (
                              <span className="mt-0.5 block truncate text-[11.5px] text-faint">{item.subtitle}</span>
                            )}
                          </span>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                              on
                                ? `${acc.arrowOn} translate-x-0 opacity-100`
                                : 'text-faint opacity-0 -translate-x-1 group-hover:translate-x-0 group-hover:text-ink group-hover:opacity-100'
                            }`}
                          >
                            <IconArrowRight size={13} strokeWidth={1.7} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
          {(idle || model.total > 0) && keyboardFooter}
        </div>
      )}
    </div>
  );
}
