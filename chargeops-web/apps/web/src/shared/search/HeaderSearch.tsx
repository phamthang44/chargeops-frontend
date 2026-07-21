import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch } from '@chargeops/ui';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  onSelect: () => void;
}

export interface Searcher {
  label: string;
  run: (query: string) => Promise<SearchResult[]>;
}

/**
 * Real search — fans a debounced query out to each console's searchers
 * (thin wrappers over the same list({search}) calls the list pages already
 * use) and renders grouped results. No fabricated backend: anything without
 * server-side search (chargers, stations) filters client-side over data the
 * console already has, and anything without a per-item detail route just
 * jumps to the right list page instead of pretending to deep-link.
 */
export function HeaderSearch({ searchers, placeholder, accent = 'brand' }: { searchers: Searcher[]; placeholder?: string; accent?: 'brand' | 'owner' }) {
  const { t } = useTranslation('ui');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<{ label: string; results: SearchResult[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

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
      const results = await Promise.all(searchers.map(async (s) => ({ label: s.label, results: await s.run(q) })));
      if (id !== reqId.current) return; // a newer keystroke already superseded this request
      setGroups(results.filter((g) => g.results.length > 0));
      setLoading(false);
    }, 250);
    return () => clearTimeout(debounce);
  }, [query, searchers]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasQuery = query.trim().length >= 2;

  return (
    <div ref={ref} className="relative hidden md:block">
      <div className={`flex h-[34px] w-[230px] items-center gap-2 rounded-ctl border border-line bg-surface px-[11px] focus-within:ring-2 ${accent === 'owner' ? 'focus-within:border-owner focus-within:ring-owner/15' : 'focus-within:border-brand focus-within:ring-brand/15'}`}>
        <IconSearch size={15} strokeWidth={2} className="shrink-0 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? t('search.placeholder')}
          className="w-full flex-1 border-none bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
        />
      </div>
      {open && hasQuery && (
        <div
          className="absolute left-0 top-full z-45 mt-1.5 max-h-[360px] w-[340px] overflow-y-auto rounded-[11px] border border-line-2 bg-surface py-1.5 shadow-[0_10px_30px_rgba(16,17,26,.12)]"
          style={{ animation: 'popIn .12s ease' }}
        >
          {loading ? (
            <div className="px-3.5 py-3 text-[12px] text-faint">{t('search.loading')}</div>
          ) : groups.length === 0 ? (
            <div className="px-3.5 py-3 text-[12px] text-faint">{t('search.empty')}</div>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="py-1">
                <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-faint">{g.label}</div>
                {g.results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                      r.onSelect();
                    }}
                    className="flex w-full flex-col items-start px-3.5 py-1.5 text-left hover:bg-chip"
                  >
                    <span className="truncate text-[12.5px] font-medium text-ink">{r.title}</span>
                    {r.subtitle && <span className="truncate text-[11px] text-faint">{r.subtitle}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
