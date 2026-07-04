import { supabase } from './supabase';
import { classifyContent } from './ai';
import { emit, markClassified, markClassifying } from './events';
import { fetchLinkMetadata, isBadMetadataText, isGenericPlatformTitle, normalizeUrl, platformFallbackTitle } from './metadata';
import { analytics, type EntrySource, type FailureReason } from './analytics';
import { PRESET_CATEGORY_ICON_MAP } from '@/constants/categoryStyle';
import type { Category, Content, NotificationSettings } from '@/types';

async function requireUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function shouldPreferDescriptionUpdate(current: string | null, next?: string) {
  if (!next) return false;
  if (!current) return true;

  const currentLooksTruncated =
    current.endsWith('...') ||
    current.endsWith('…') ||
    /\.\.\.\s*$/.test(current);

  if (currentLooksTruncated && next.length > current.length) {
    return true;
  }

  return next.includes('\n') && !current.includes('\n') && next.length >= current.length;
}

export function isDuplicateContentUrlError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');

  return (
    message.includes('contents_user_id_url_key') ||
    message.includes('contents_user_url_unique') ||
    message.includes('duplicate key value') ||
    (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    )
  );
}

// ─── Categories ───

export async function getCategories() {
  const userId = await requireUserId();

  // sort_order 우선(nulls last), created_at 타이브레이커
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function getCategoryWithCount(categoryId: string) {
  const userId = await requireUserId();

  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('id', categoryId)
    .single();
  if (catError) throw catError;

  const { count, error: countError } = await supabase
    .from('contents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category_id', categoryId);
  if (countError) throw countError;

  return { category: category as Category, count: count ?? 0 };
}

export async function getCategoriesWithCounts() {
  const userId = await requireUserId();

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (catError) throw catError;

  const { data: counts, error: countError } = await supabase
    .from('contents')
    .select('category_id')
    .eq('user_id', userId)
    .not('category_id', 'is', null);
  if (countError) throw countError;

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    if (row.category_id) {
      countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
    }
  }

  return (categories as Category[]).map(cat => ({
    ...cat,
    count: countMap[cat.id] ?? 0,
  }));
}

export async function createCategory(
  name: string,
  options?: { color?: string | null; icon?: string | null },
) {
  const userId = await requireUserId();

  // 새 카테고리는 sort_order max + 1로 부여 (맨 뒤 자동 추가)
  const { data: maxRow } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('user_id', userId)
    .not('sort_order', 'is', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name,
      color: options?.color ?? null,
      icon: options?.icon ?? null,
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

// 카테고리 순서 일괄 업데이트. orderedIds[0] → sort_order 1, [1] → 2, ...
export async function reorderCategories(orderedIds: string[]) {
  const userId = await requireUserId();
  if (orderedIds.length === 0) return;

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index + 1 })
        .eq('user_id', userId)
        .eq('id', id)
        .select('id')
        .single(),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function updateCategory(
  id: string,
  patch: { name?: string; color?: string | null; icon?: string | null },
) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

// ─── Contents ───

export async function getRecentContents(limit = 10) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as (Content & { categories: { name: string } | null })[];
}

export async function getRelatedContents(content: Content, limit = 2) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .neq('id', content.id);
  if (error) throw error;

  const items = data as (Content & { categories: { name: string } | null })[];

  const scored = items.map((item) => {
    let score = 0;
    if (content.category_id && item.category_id === content.category_id) score += 3;
    const tagOverlap = item.tags.filter((t) => content.tags.includes(t)).length;
    score += tagOverlap * 2;
    if (content.domain && item.domain === content.domain) score += 1;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score || new Date(b.item.saved_at).getTime() - new Date(a.item.saved_at).getTime());

  return scored.filter((s) => s.score >= 2).slice(0, limit).map((s) => s.item);
}

export async function getContentsByCategory(categoryId: string) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return data as Content[];
}

export async function getUncategorizedContents() {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('user_id', userId)
    .is('category_id', null)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return data as Content[];
}

export async function getUncategorizedCount(): Promise<number> {
  const userId = await requireUserId();

  const { count, error } = await supabase
    .from('contents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('category_id', null);
  if (error) throw error;
  return count ?? 0;
}

export async function getContentById(id: string) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Content & { categories: { name: string } | null };
}

function classifyFailureReason(error: unknown): FailureReason {
  if (isDuplicateContentUrlError(error)) return 'duplicate_url';
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/invalid url|malformed|cannot parse url/i.test(message)) return 'invalid_url';
  if (/network|fetch|timeout|abort|ECONN|ENOTFOUND/i.test(message)) return 'network_error';
  if (
    (typeof error === 'object' && error !== null && 'code' in error) ||
    /5\d\d|server|database|postgres/i.test(message)
  ) return 'server_error';
  return 'unknown';
}

export async function saveContent(
  input: {
    url: string;
    title?: string;
    thumbnail_url?: string;
    domain?: string;
  },
  options?: {
    entry_source?: EntrySource;
    /** Safari 공유 시 share extension이 전달한 페이지 head meta. fetchLinkMetadata에 위임. */
    shareIntentMeta?: Record<string, string | undefined> | null;
  },
) {
  const entrySource = options?.entry_source ?? 'direct';
  void analytics.saveAttempted(entrySource);

  let saved: Content;
  let metaDescription: string | undefined;

  try {
    const userId = await requireUserId();

    const normalizedUrl = normalizeUrl(input.url);
    const metadata = await fetchLinkMetadata(normalizedUrl, {
      shareIntentMeta: options?.shareIntentMeta,
    });
    const contentInput = {
      ...input,
      url: normalizedUrl,
      title: input.title ?? metadata.title,
      description: metadata.description ?? null,
      thumbnail_url: input.thumbnail_url ?? metadata.thumbnail_url,
      domain: input.domain ?? metadata.domain,
    };
    metaDescription = metadata.description;

    const { data, error } = await supabase
      .from('contents')
      .insert({ user_id: userId, ...contentInput })
      .select()
      .single();
    if (error) throw error;

    saved = data as Content;
  } catch (err) {
    void analytics.saveFailed(classifyFailureReason(err), entrySource);
    throw err;
  }

  // 비동기 AI 분류 (저장 UX와 분리, 실패해도 저장은 유지).
  // markClassifying은 saveContent return 전에 동기로 수행되어
  // 호출자가 emit('content-saved')로 화면을 갱신할 때 "분류 중" 상태가 반영되도록 보장.
  markClassifying(saved.id);
  classifyAndUpdate(saved, metaDescription)
    .catch(err => console.warn('AI classification failed:', err))
    .finally(() => {
      markClassified(saved.id);
      emit('content-classified');
    });

  return saved;
}

export async function refreshContentMetadata(
  content: Content & { categories?: { name: string } | null },
): Promise<Content & { categories: { name: string } | null }> {
  const userId = await requireUserId();
  const metadata = await fetchLinkMetadata(content.url);
  const updates: {
    title?: string;
    description?: string | null;
    thumbnail_url?: string;
    domain?: string;
  } = {};

  if (
    (!content.title ||
      content.title === content.url ||
      isPlaceholderTitle(content) ||
      isMetadataPolluted(content)) &&
    metadata.title
  ) {
    updates.title = metadata.title;
  }

  if (shouldPreferDescriptionUpdate(content.description, metadata.description)) {
    updates.description = metadata.description;
  } else if (isMetadataPolluted(content) && isBadMetadataText(content.description)) {
    updates.description = metadata.description ?? null;
  }

  if (!content.thumbnail_url && metadata.thumbnail_url) {
    updates.thumbnail_url = metadata.thumbnail_url;
  }

  if (!content.domain && metadata.domain) {
    updates.domain = metadata.domain;
  }

  if (Object.keys(updates).length === 0) {
    return {
      ...content,
      categories: content.categories ?? null,
    };
  }

  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', content.id)
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data as Content & { categories: { name: string } | null };
}

function isMetadataPolluted(content: Content) {
  return (
    isBadMetadataText(content.title) ||
    isBadMetadataText(content.description) ||
    isGenericPlatformTitle(content.title)
  );
}

function isPlaceholderTitle(content: Content) {
  if (!content.title) return false;
  return content.title === platformFallbackTitle(content.url);
}

export async function updateContent(id: string, updates: {
  category_id?: string | null;
  tags?: string[];
  title?: string;
}) {
  const userId = await requireUserId();

  if (updates.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('id', updates.category_id)
      .maybeSingle();
    if (categoryError) throw categoryError;
    if (!category) throw new Error('Category not found');
  }

  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Content;
}

export async function deleteContent(id: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
  emit('content-deleted', [id]);
}

export async function moveContents(ids: string[], categoryId: string | null) {
  if (ids.length === 0) return;

  const userId = await requireUserId();

  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('id', categoryId)
      .maybeSingle();
    if (categoryError) throw categoryError;
    if (!category) throw new Error('Category not found');
  }

  const { error } = await supabase
    .from('contents')
    .update({ category_id: categoryId })
    .eq('user_id', userId)
    .in('id', ids);
  if (error) throw error;
}

export async function deleteContents(ids: string[]) {
  if (ids.length === 0) return;

  const userId = await requireUserId();

  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);
  if (error) throw error;
  emit('content-deleted', ids);
}

export async function markContentViewed(id: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('contents')
    .update({ viewed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

// ─── Rediscover (관심사 기반 + 망각도 추천 / viewed 무관) ───
// §067: viewed_at 필터 제거. "저장했는지 까먹은 콘텐츠"가 핵심이지 "본 적 없음"이 핵심이 아님.
// 본 적 있어도 한동안 안 들어왔으면 후보. 망각도 = lastInteraction(viewed_at ?? saved_at) 기준.

export async function getRediscoverContents(limit = 5, minAgeDays = 2, maxAgeDays = 14) {
  const userId = await requireUserId();

  // 1. 전체 콘텐츠로 카테고리별 조회율(관심도) 계산
  const { data: allContents, error: allError } = await supabase
    .from('contents')
    .select('category_id, viewed_at')
    .eq('user_id', userId)
    .not('category_id', 'is', null);
  if (allError) throw allError;

  const catStats: Record<string, { total: number; viewed: number }> = {};
  for (const row of allContents ?? []) {
    const cid = row.category_id!;
    if (!catStats[cid]) catStats[cid] = { total: 0, viewed: 0 };
    catStats[cid].total++;
    if (row.viewed_at) catStats[cid].viewed++;
  }

  const interestRate = (categoryId: string | null): number => {
    if (!categoryId || !catStats[categoryId]) return 0;
    const s = catStats[categoryId];
    return s.total > 0 ? s.viewed / s.total : 0;
  };

  // 2. 후보 풀: 최근 maxAgeDays 내 저장, minAgeDays 이상 숙성 (Recent와 시간대 분리)
  const since = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
  const matureBefore = new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .gte('saved_at', since)
    .lte('saved_at', matureBefore);
  if (error) throw error;

  const items = data as (Content & { categories: { name: string } | null })[];
  const now = Date.now();

  // 3. 관심도 × 망각도. 망각도 = daysSinceLastInteraction / 7
  //    lastInteraction = viewed_at ?? saved_at — 본 적 있어도 본 지 오래되면 점수 ↑
  const scored = items.map((item) => {
    const interest = interestRate(item.category_id);
    const lastInteractionMs = item.viewed_at
      ? new Date(item.viewed_at).getTime()
      : new Date(item.saved_at).getTime();
    const daysSinceLastInteraction = (now - lastInteractionMs) / (1000 * 60 * 60 * 24);
    const forgottenness = Math.max(daysSinceLastInteraction / 7, 0.1);
    return { item, score: interest * forgottenness };
  });

  scored.sort((a, b) => b.score - a.score);

  // 4. 다양성: 카테고리당 최대 2개
  const result: typeof items = [];
  const catCount: Record<string, number> = {};
  for (const { item } of scored) {
    const cid = item.category_id ?? '__uncategorized__';
    catCount[cid] = (catCount[cid] ?? 0) + 1;
    if (catCount[cid] > 2) continue;
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

// ─── Interest Insight (관심 카테고리 급부상 시그널) ───
// §068: 최근 14일 vs 이전 14일 카테고리별 저장 수 비교. 평소보다 늘어난 Top 1 카테고리.

export type InterestInsight = {
  categoryId: string;
  categoryName: string;
  recent: number;  // 최근 14일 저장 수
  previous: number;  // 이전 14일 저장 수
};

export async function getInterestInsight(windowDays = 14): Promise<InterestInsight | null> {
  const userId = await requireUserId();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - windowMs * 2).toISOString();
  const cutoff = new Date(Date.now() - windowMs).toISOString();

  const { data, error } = await supabase
    .from('contents')
    .select('category_id, saved_at, categories(name)')
    .eq('user_id', userId)
    .not('category_id', 'is', null)
    .gte('saved_at', since);
  if (error) throw error;

  type Row = { category_id: string; saved_at: string; categories: { name: string } | null };
  const rows = (data as unknown as Row[]) ?? [];

  const stats: Record<string, { name: string; recent: number; previous: number }> = {};
  for (const row of rows) {
    const cid = row.category_id;
    const name = row.categories?.name ?? '';
    if (!name) continue;
    if (!stats[cid]) stats[cid] = { name, recent: 0, previous: 0 };
    if (row.saved_at >= cutoff) stats[cid].recent++;
    else stats[cid].previous++;
  }

  // 임계값: delta >= 3 AND (이전==0이면 최근>=3 / 그 외엔 최근/이전 >= 2)
  const candidates: InterestInsight[] = [];
  for (const [cid, s] of Object.entries(stats)) {
    const delta = s.recent - s.previous;
    if (delta < 3) continue;
    if (s.previous === 0) {
      if (s.recent < 3) continue;
    } else {
      if (s.recent / s.previous < 2) continue;
    }
    candidates.push({ categoryId: cid, categoryName: s.name, recent: s.recent, previous: s.previous });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (b.recent - b.previous) - (a.recent - a.previous));
  return candidates[0];
}

// Phase 2 리포트용 단일 fetch. 카테고리/분포/관련 주제를 클라이언트에서 derive.
// 미분류(category_id IS NULL)도 포함해서 가져옴 — "분류되지 않은 콘텐츠 N개" 안내 위해.
export type ReportItem = {
  id: string;
  category_id: string | null;
  categories: { name: string } | null;
  tags: string[];
  saved_at: string;
};

export async function getRecentContentsForReport(days: number): Promise<ReportItem[]> {
  const userId = await requireUserId();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('contents')
    .select('id, category_id, categories(name), tags, saved_at')
    .eq('user_id', userId)
    .gte('saved_at', since);
  if (error) throw error;
  // supabase 자동 추론 타입은 categories를 array로 보지만, 단일 FK join은 single object.
  // 기존 패턴(getRediscoverContents)과 동일하게 unknown 경유 캐스팅.
  return (data ?? []) as unknown as ReportItem[];
}

// 한 번이라도 열어봤지만 오랫동안 다시 보지 않은 콘텐츠.
// Rediscover(viewed_at IS NULL, 한 번도 안 본 것)와 명확히 구분.
// 기간은 14일 — 사용 데이터가 충분히 쌓여 30일이 더 적절해지면 별도 결정으로 변경.
export async function getForgottenContents(limit = 10, days = 14, maxPerCategory = 2) {
  const userId = await requireUserId();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const candidateLimit = Math.max(limit * maxPerCategory * 2, 40);
  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .not('viewed_at', 'is', null)
    .lt('viewed_at', since)
    .order('viewed_at', { ascending: true })
    .limit(candidateLimit);
  if (error) throw error;

  const items = (data ?? []) as (Content & { categories: { name: string } | null })[];
  const result: typeof items = [];
  const catCount: Record<string, number> = {};

  for (const item of items) {
    const cid = item.category_id ?? '__uncategorized__';
    catCount[cid] = (catCount[cid] ?? 0) + 1;
    if (catCount[cid] > maxPerCategory) continue;
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

// ─── AI Classification (비동기) ───

async function classifyAndUpdate(content: Content, description?: string) {
  const userId = content.user_id;
  const result = await classifyContent({
    url: content.url,
    title: content.title,
    domain: content.domain,
    description,
  });
  if (!result) return;

  const updates: { tags?: string[]; category_id?: string | null; title?: string } = {};

  if (result.tags.length > 0) {
    updates.tags = result.tags;
  }

  // AI가 제안한 제목이 있고, 기존 제목이 제네릭이면 업데이트
  if (result.suggested_title) {
    updates.title = result.suggested_title;
  }

  if (result.category !== null) {
    // 카테고리 이름 → ID 매핑
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', result.category)
      .single();
    if (cat) {
      updates.category_id = cat.id;
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('contents')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', content.id);
  }
}

// ─── Onboarding ───

export async function createInitialCategories(names: string[]) {
  const userId = await requireUserId();

  // 이미 카테고리가 있으면 중복 생성 방지
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (count && count > 0) return [];

  const rows = names.map((name, index) => ({
    user_id: userId,
    name,
    icon: PRESET_CATEGORY_ICON_MAP[name] ?? null,
    color: null,
    sort_order: index + 1,
  }));
  const { data, error } = await supabase
    .from('categories')
    .insert(rows)
    .select();
  if (error) throw error;
  return data as Category[];
}

// ─── Account ───

export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
}

// ─── Push Notifications ───

export async function upsertDeviceToken(input: {
  expoPushToken: string;
  platform: 'ios' | 'android';
  deviceName?: string | null;
}) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: input.expoPushToken,
        platform: input.platform,
        device_name: input.deviceName ?? null,
      },
      { onConflict: 'user_id,expo_push_token' },
    );
  if (error) throw error;
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as NotificationSettings | null) ?? null;
}

/**
 * 알림 설정 upsert. 최초 호출 시 기본값으로 row가 생성됨.
 * quiet_hours_start/end는 0~23 정수. timezone은 IANA(기본 Asia/Seoul).
 */
export async function upsertNotificationSettings(
  patch: Partial<Omit<NotificationSettings, 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<NotificationSettings> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(
      {
        user_id: userId,
        ...patch,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as NotificationSettings;
}
