import type { ReportItem } from './api';

export type CategoryStat = {
  categoryId: string;
  categoryName: string;
  count: number;
};

export type DistributionStat = CategoryStat & { percentage: number };

export type SubjectStat = {
  categoryId: string;
  categoryName: string;
  tags: string[];
};

const TAG_LIMIT_PER_CATEGORY = 3;

// 분류된 콘텐츠만 카테고리별 집계. 미분류는 별도 카운팅으로 처리.
function aggregateByCategory(items: ReportItem[]): CategoryStat[] {
  const map = new Map<string, CategoryStat>();
  for (const item of items) {
    if (!item.category_id || !item.categories?.name) continue;
    const existing = map.get(item.category_id);
    if (existing) {
      existing.count++;
    } else {
      map.set(item.category_id, {
        categoryId: item.category_id,
        categoryName: item.categories.name,
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// 분류된 콘텐츠 기준 비율(%). 100 합산 보장 위해 마지막 항목은 잔여로 보정.
export function computeDistribution(items: ReportItem[]): DistributionStat[] {
  const stats = aggregateByCategory(items);
  const total = stats.reduce((s, x) => s + x.count, 0);
  if (total === 0) return [];

  let assigned = 0;
  const last = stats.length - 1;
  return stats.map((s, i) => {
    const raw = (s.count / total) * 100;
    const percentage = i === last ? 100 - assigned : Math.round(raw);
    if (i !== last) assigned += percentage;
    return { ...s, percentage };
  });
}

// 카테고리당 자주 등장한 태그 Top N.
// 핵심 규칙: category 이름과 같은 tag는 제외 (예: category=AI, tag=AI).
export function topTagsPerCategory(items: ReportItem[]): SubjectStat[] {
  type Entry = { categoryName: string; tagCounts: Map<string, number> };
  const map = new Map<string, Entry>();

  for (const item of items) {
    if (!item.category_id || !item.categories?.name) continue;
    const categoryName = item.categories.name;
    const lowerCategoryName = categoryName.toLowerCase();

    if (!map.has(item.category_id)) {
      map.set(item.category_id, { categoryName, tagCounts: new Map() });
    }
    const entry = map.get(item.category_id)!;

    for (const tag of item.tags ?? []) {
      if (tag.toLowerCase() === lowerCategoryName) continue;
      entry.tagCounts.set(tag, (entry.tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([categoryId, { categoryName, tagCounts }]) => ({
      categoryId,
      categoryName,
      tags: Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, TAG_LIMIT_PER_CATEGORY)
        .map(([tag]) => tag),
    }))
    .filter((s) => s.tags.length > 0);
}

export function countCategorized(items: ReportItem[]): number {
  return items.filter((item) => !!item.category_id).length;
}

// 7일 vs 30일 분기 — 클라이언트에서 한 번의 30일 fetch 결과를 in-memory로 자른다.
export function filterWithinDays(items: ReportItem[], days: number): ReportItem[] {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => new Date(item.saved_at).getTime() >= since);
}
