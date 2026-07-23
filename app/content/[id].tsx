import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors, Radius } from '@/constants';
import { ActionSheet } from '@/components/ActionSheet';
import { MoveCategorySheet } from '@/components/MoveCategorySheet';
import { ContentTitleSheet } from '@/components/ContentTitleSheet';
import { TagsSheet } from '@/components/TagsSheet';
import { ReminderSheet } from '@/components/ReminderSheet';
import { Ionicons } from '@expo/vector-icons';
import { getContentById, markContentViewed, deleteContent, getRelatedContents, refreshContentMetadata, updateContent } from '@/lib/api';
import { useContentReminder } from '@/lib/useContentReminder';
import { formatReminderStatus, type ReminderPreset } from '@/lib/reminders';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/lib/AuthProvider';
import { formatSource, THUMBNAIL_PLACEHOLDER, openInAppOrBrowser } from '@/lib/utils';
import { isBadMetadataText, isGenericPlatformTitle } from '@/lib/metadata';
import { analytics, type ContentOpenedSource } from '@/lib/analytics';

const CONTENT_OPENED_SOURCES: ReadonlySet<ContentOpenedSource> = new Set([
  'rediscover', 'forgotten', 'recent', 'category', 'search', 'related', 'unread_reminder', 'direct',
]);

function normalizeSource(raw: string | string[] | undefined): ContentOpenedSource {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && CONTENT_OPENED_SOURCES.has(value as ContentOpenedSource)
    ? (value as ContentOpenedSource)
    : 'direct';
}
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };
const DESCRIPTION_COLLAPSED_LINES = 6;

function formatDescription(value: string) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function shouldRefreshDescription(content: ContentWithCategory) {
  return Boolean(
    !content.description ||
    (content.description.length > 120 && !content.description.includes('\n')),
  );
}

function shouldRefreshMetadata(content: ContentWithCategory) {
  return Boolean(
    !content.thumbnail_url ||
    !content.title ||
    content.title === content.url ||
    shouldRefreshDescription(content) ||
    isPollutedMetadata(content),
  );
}

function isNotionDomain(domain?: string | null) {
  if (!domain) return false;
  const host = domain.toLowerCase();
  return host === 'notion.so' || host === 'notion.com' || host.endsWith('.notion.site');
}

function isPollutedMetadata(content: ContentWithCategory) {
  return (
    isBadMetadataText(content.title) ||
    isBadMetadataText(content.description) ||
    isGenericPlatformTitle(content.title)
  );
}

function RelatedCard({
  title,
  source,
  thumbnailUrl,
  thumb,
  onPress,
}: {
  title: string;
  source: string;
  thumbnailUrl?: string | null;
  thumb: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.relatedCard}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.relatedThumb}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <View style={[styles.relatedThumb, { backgroundColor: thumb }]} />
      )}
      <View style={styles.relatedText}>
        <Text style={styles.relatedTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.relatedSource}>{source}</Text>
      </View>
    </Pressable>
  );
}

export default function ContentDetailScreen() {
  const router = useRouter();
  const { id, source: rawSource } = useLocalSearchParams<{ id: string; source?: string }>();
  const source = normalizeSource(rawSource);
  const { session, isLoading: isAuthLoading } = useAuth();
  const [showSheet, setShowSheet] = useState(false);
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [showTitleSheet, setShowTitleSheet] = useState(false);
  const [showTagsSheet, setShowTagsSheet] = useState(false);
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const toast = useToast();
  const reminderState = useContentReminder(typeof id === 'string' ? id : null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ContentWithCategory | null>(null);
  const [related, setRelated] = useState<ContentWithCategory[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // 콘텐츠/관련 로드는 id가 바뀔 때만 실행.
  // useFocusEffect로 두면 관련 콘텐츠 카드 → 뒤로가기 복귀 시에도 재발화되어
  // related state가 비워지고 skeleton → 리스트 재렌더가 깜빡거려 보인다.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setRelated([]);
    setRelatedLoading(true);

    (async () => {
      try {
        const content = await getContentById(id);
        if (cancelled) return;
        setItem(content);
        setDescriptionExpanded(false);
        setLoading(false);

        if (shouldRefreshMetadata(content)) {
          refreshContentMetadata(content)
            .then((updated) => {
              if (!cancelled) setItem(updated);
            })
            .catch((error) => console.warn('Metadata refresh failed:', error));
        }

        // 관련 콘텐츠(카테고리 +3, 태그 겹침 ×2, 같은 도메인 +1)는 본문 렌더를 막지 않도록 fire-and-forget.
        getRelatedContents(content, 2)
          .then((relatedItems) => {
            if (!cancelled) setRelated(relatedItems);
          })
          .catch((error) => console.warn('Related load failed:', error))
          .finally(() => {
            if (!cancelled) setRelatedLoading(false);
          });
      } catch (e) {
        console.error('Content load error:', e);
        if (!cancelled) {
          setLoading(false);
          setRelatedLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, session, isAuthLoading]);

  // viewed_at 업데이트 + content_opened 발화는 focus 진입마다 유지 (§12.5).
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      markContentViewed(id).catch(() => {});
      void analytics.contentOpened(id, source);
    }, [id, source, session])
  );

  const handleMoveCategory = async (categoryId: string | null) => {
    if (!item) return;
    try {
      await updateContent(id, { category_id: categoryId });
      const updated = await getContentById(id);
      setItem(updated);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdateTitle = async (title: string) => {
    if (!item) return;
    try {
      const updated = await updateContent(id, { title });
      setItem(prev => prev ? { ...prev, title: updated.title } : prev);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdateTags = async (tags: string[]) => {
    if (!item) return;
    try {
      const updated = await updateContent(id, { tags });
      setItem(prev => prev ? { ...prev, tags: updated.tags } : prev);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('콘텐츠 삭제', '이 콘텐츠를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await deleteContent(id);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={Colors.tertiary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.tertiary }}>콘텐츠를 찾을 수 없어요</Text>
      </View>
    );
  }

  const description = item.description ? formatDescription(item.description) : '';
  const isLongDescription = description.length > 220 || description.split('\n').length > DESCRIPTION_COLLAPSED_LINES;
  const isNotion = isNotionDomain(item.domain);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.nav}>
            <Pressable onPress={() => router.back()} style={styles.navButton}>
              <Ionicons name="chevron-back" size={18} color={Colors.primary} />
            </Pressable>
            <View style={styles.navRight}>
              <Pressable onPress={() => setShowReminderSheet(true)} style={styles.navButton}>
                <Ionicons
                  name={reminderState.reminder ? 'notifications' : 'notifications-outline'}
                  size={18}
                  color={reminderState.reminder ? Colors.accent : Colors.primary}
                />
              </Pressable>
              <Pressable onPress={() => setShowSheet(true)} style={styles.navButton}>
                <Ionicons name="ellipsis-horizontal" size={18} color={Colors.primary} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          {/* Header card */}
          <View style={styles.headerCard}>
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : isNotion ? (
              <View style={[styles.heroImage, styles.notionHeroImage]}>
                <Ionicons name="document-text-outline" size={46} color={Colors.primary} />
                <Text style={styles.notionHeroText}>Notion</Text>
              </View>
            ) : (
              <View style={[styles.heroImage, { backgroundColor: THUMBNAIL_PLACEHOLDER }]} />
            )}
            <View style={styles.headerMeta}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryMeta}>
                  <Ionicons name="folder-outline" size={10} color={Colors.tertiary} />
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {item.categories?.name ?? '미분류'} · {formatSource(item.domain)}
                  </Text>
                </View>
                <Pressable onPress={() => openInAppOrBrowser(item.url)} style={styles.originalLinkButton}>
                  <Text style={styles.originalLink}>원문 바로가기 →</Text>
                </Pressable>
              </View>
              <Text style={styles.title}>{item.title ?? item.url}</Text>
            </View>
          </View>

          {/* Tags */}
          {item.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
              {item.tags.map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* 내용 section */}
          {description ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>내용</Text>
              <Text
                style={styles.sectionBody}
                numberOfLines={descriptionExpanded ? undefined : DESCRIPTION_COLLAPSED_LINES}
              >
                {description}
              </Text>
              {isLongDescription && (
                <Pressable
                  onPress={() => setDescriptionExpanded(prev => !prev)}
                  style={styles.moreButton}
                >
                  <Text style={styles.moreText}>{descriptionExpanded ? '접기' : '더보기'}</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* 관련 콘텐츠 — 본문과 분리해서 lazy 로딩. 로딩 중엔 skeleton. */}
          {(relatedLoading || related.length > 0) && (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Text style={styles.relatedSectionTitle}>관련 콘텐츠</Text>
                <Text style={styles.relatedSubtitle}>같은 관심사와 관련된 저장 콘텐츠</Text>
              </View>
              <View style={styles.relatedList}>
                {relatedLoading && related.length === 0 ? (
                  <>
                    <View style={[styles.relatedCard, styles.relatedSkeletonCard]}>
                      <View style={[styles.relatedThumb, styles.relatedSkeletonThumb]} />
                      <View style={styles.relatedText}>
                        <View style={styles.relatedSkeletonLine} />
                        <View style={[styles.relatedSkeletonLine, styles.relatedSkeletonLineShort]} />
                      </View>
                    </View>
                    <View style={[styles.relatedCard, styles.relatedSkeletonCard]}>
                      <View style={[styles.relatedThumb, styles.relatedSkeletonThumb]} />
                      <View style={styles.relatedText}>
                        <View style={styles.relatedSkeletonLine} />
                        <View style={[styles.relatedSkeletonLine, styles.relatedSkeletonLineShort]} />
                      </View>
                    </View>
                  </>
                ) : (
                  related.map(r => (
                    <RelatedCard
                      key={r.id}
                      title={r.title ?? r.url}
                      source={formatSource(r.domain)}
                      thumbnailUrl={r.thumbnail_url}
                      thumb={THUMBNAIL_PLACEHOLDER}
                      onPress={() => router.push({
                        pathname: '/content/[id]',
                        params: { id: r.id, source: 'related' },
                      })}
                    />
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <ActionSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        actions={[
          { label: '제목 수정', onPress: () => setShowTitleSheet(true) },
          { label: '태그 수정', onPress: () => setShowTagsSheet(true) },
          { label: '카테고리 변경', onPress: () => setShowMoveSheet(true) },
          { label: '삭제', danger: true, onPress: handleDelete },
        ]}
      />
      {/* iOS RN Modal race 회피: fade out 도중 Stack.Screen이 pop되면 backdrop container가
          orphan 상태로 남아 터치 캡처 → 화면 먹통. visible이 false일 때 아예 unmount 시켜
          native modal이 확실히 destroy되게 함. 여러 Modal이 동시에 mount된 상태 자체도
          iOS에서 dismiss race를 유발하므로 4개 시트 모두 조건부 렌더로 통일. */}
      {showTitleSheet && (
        <ContentTitleSheet
          visible
          initialValue={item?.title ?? ''}
          onClose={() => setShowTitleSheet(false)}
          onSubmit={handleUpdateTitle}
        />
      )}
      {showTagsSheet && (
        <TagsSheet
          visible
          initialTags={item?.tags ?? []}
          onClose={() => setShowTagsSheet(false)}
          onSubmit={handleUpdateTags}
        />
      )}
      {showMoveSheet && (
        <MoveCategorySheet
          visible
          currentCategoryId={item?.category_id}
          onClose={() => setShowMoveSheet(false)}
          onSelect={handleMoveCategory}
        />
      )}
      {showReminderSheet && (
        <ReminderSheet
          visible
          reminder={reminderState.reminder}
          busy={reminderState.busy}
          onClose={() => setShowReminderSheet(false)}
          onSchedule={async (remindAt) => {
            // schedule/cancel 완료 후 dismiss. optimistic dismiss(setShow false를 await 앞으로)는
            // ReminderSheet unmount와 iOS scheduleNotificationAsync 사이 race를 유발해
            // 스케줄이 실제로 등록되지 않는 이슈가 있었음. race는 conditional mount만으로 충분.
            try {
              const record = await reminderState.schedule({
                title: item?.title ?? item?.url ?? '',
                remindAt,
              });
              setShowReminderSheet(false);
              if (record) {
                toast.show(`리마인더 예약됨 · ${formatReminderStatus(record.remindAt)}`, 'success');
              }
            } catch (e) {
              setShowReminderSheet(false);
              const msg = e instanceof Error && e.message === 'notification_permission_denied'
                ? '알림 권한이 필요해요. 설정에서 허용해주세요.'
                : '리마인더 예약에 실패했어요';
              toast.show(msg, 'error');
            }
          }}
          onCancelReminder={async () => {
            await reminderState.cancel();
            setShowReminderSheet(false);
            toast.show('리마인더 취소', 'success');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  heroImage: {
    height: 200,
    width: '100%',
  },
  notionHeroImage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notionHeroText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerMeta: {
    padding: 14,
    paddingBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  categoryMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '500',
    color: Colors.tertiary,
  },
  originalLinkButton: {
    flexShrink: 0,
    paddingLeft: 6,
    paddingVertical: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  originalLink: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.accent,
  },
  tagsScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  tagPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginRight: 7,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tagPillText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.tertiary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
  },
  sectionBody: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.primary,
    lineHeight: 21.5,
  },
  moreButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
    paddingRight: 8,
  },
  moreText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.accent,
  },
  relatedSection: {
    marginTop: 24,
  },
  relatedHeader: {
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  relatedSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  relatedSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 17,
  },
  relatedList: {
    gap: 10,
  },
  relatedCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 11,
    padding: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  relatedText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  relatedTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 17,
  },
  relatedSource: {
    fontSize: 11,
    color: Colors.secondary,
  },
  relatedSkeletonCard: {
    opacity: 0.7,
  },
  relatedSkeletonThumb: {
    backgroundColor: Colors.border,
  },
  relatedSkeletonLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: Colors.border,
    width: '90%',
  },
  relatedSkeletonLineShort: {
    width: '55%',
    marginTop: 6,
  },
});
