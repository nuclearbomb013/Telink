/**
 * History Service - 浏览历史记录
 *
 * CLIENT-SIDE ONLY: Stores browsing history in localStorage.
 * This is a UI convenience feature, NOT a business data source.
 * History is per-device and does NOT sync across devices or browsers.
 *
 * Do NOT use this for:
 *   - Permission checks
 *   - Recommendations (without explicit user opt-in)
 *   - Backend statistics
 */

const HISTORY_KEY_PREFIX = 'techink_history';
const MAX_HISTORY = 50;

export interface HistoryEntry {
  content_type: string;
  content_id: number | string;
  title: string;
  slug?: string;
  viewed_at: number;
  scrollY?: number;
}

function getKey(userId: number | null): string {
  const uid = userId ?? 0;
  return `${HISTORY_KEY_PREFIX}_${uid}`;
}

function loadHistory(userId: number | null): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(userId: number | null, entries: HistoryEntry[]): void {
  const trimmed = entries.slice(0, MAX_HISTORY);
  localStorage.setItem(getKey(userId), JSON.stringify(trimmed));
}

export const historyService = {
  getHistory(userId: number | null): HistoryEntry[] {
    return loadHistory(userId);
  },

  addEntry(userId: number | null, entry: Omit<HistoryEntry, 'viewed_at'>): void {
    const history = loadHistory(userId);
    const existing = history.findIndex(
      e => e.content_type === entry.content_type && String(e.content_id) === String(entry.content_id)
    );
    const previousScrollY = existing !== -1 ? history[existing].scrollY : undefined;
    if (existing !== -1) {
      history.splice(existing, 1);
    }
    history.unshift({ ...entry, scrollY: entry.scrollY ?? previousScrollY, viewed_at: Date.now() });
    saveHistory(userId, history);
  },

  removeEntry(userId: number | null, contentType: string, contentId: number | string): void {
    const history = loadHistory(userId);
    const filtered = history.filter(
      e => !(e.content_type === contentType && String(e.content_id) === String(contentId))
    );
    saveHistory(userId, filtered);
  },

  clearHistory(userId: number | null): void {
    localStorage.removeItem(getKey(userId));
  },

  getHistoryByType(userId: number | null, contentType: string): HistoryEntry[] {
    return loadHistory(userId).filter(e => e.content_type === contentType);
  },

  getEntry(userId: number | null, contentType: string, contentId: number | string): HistoryEntry | null {
    return loadHistory(userId).find(
      e => e.content_type === contentType && String(e.content_id) === String(contentId)
    ) || null;
  },

  updateScrollPosition(
    userId: number | null,
    contentType: string,
    contentId: number | string,
    scrollY: number
  ): void {
    const history = loadHistory(userId);
    const existing = history.findIndex(
      e => e.content_type === contentType && String(e.content_id) === String(contentId)
    );
    if (existing === -1) return;
    history[existing] = { ...history[existing], scrollY, viewed_at: Date.now() };
    saveHistory(userId, history);
  },
};
