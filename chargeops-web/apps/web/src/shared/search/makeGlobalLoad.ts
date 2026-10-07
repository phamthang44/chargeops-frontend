import type { GlobalSearchGroup, GlobalSearchHit, GlobalSearchType, SearchService } from '@chargeops/api';
import type { SearchGroupLoad, SearchResult } from './HeaderSearch';

/** Per-console navigation targets, keyed by aggregate search group. */
export type GlobalSearchRoutes = Partial<Record<GlobalSearchType, (hit: GlobalSearchHit) => void>>;

/**
 * Adapts the aggregate `SearchService.global` result into HeaderSearch's load
 * contract: groups the console has no route for are dropped instead of
 * rendering dead rows, and every hit gets its `onSelect` from the console's
 * route map (detail route where one exists, otherwise the list page).
 */
export function makeGlobalLoad(
  search: SearchService,
  routes: GlobalSearchRoutes,
): (query: string) => Promise<SearchGroupLoad[]> {
  return async (query) => {
    const groups: GlobalSearchGroup[] = await search.global(query);
    const out: SearchGroupLoad[] = [];
    for (const group of groups) {
      const route = routes[group.type];
      if (!route) continue;
      const results: SearchResult[] = group.items.map((item) => ({
        id: `${group.type}:${item.id}`,
        title: item.title,
        subtitle: item.subtitle ?? undefined,
        badge: item.badge ?? undefined,
        onSelect: () => route(item),
      }));
      if (results.length > 0) out.push({ type: group.type, results });
    }
    return out;
  };
}
