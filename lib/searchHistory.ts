import * as SecureStore from 'expo-secure-store';

const KEY = 'search_recent_terms';
const MAX = 10;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(term: string): Promise<string[]> {
  const trimmed = term.trim();
  if (trimmed.length === 0) return getRecentSearches();
  try {
    const current = await getRecentSearches();
    const deduped = [trimmed, ...current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())];
    const next = deduped.slice(0, MAX);
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecentSearches();
  }
}

export async function removeRecentSearch(term: string): Promise<string[]> {
  try {
    const current = await getRecentSearches();
    const next = current.filter((t) => t.toLowerCase() !== term.toLowerCase());
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecentSearches();
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // silent — non-critical
  }
}
