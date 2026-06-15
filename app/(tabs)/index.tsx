import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { RediscoverCard } from '@/components/RediscoverCard';
import { SectionHeader } from '@/components/SectionHeader';
import { SearchBar } from '@/components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents, getRediscoverContents } from '@/lib/api';
import { on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, placeholderColor, rediscoverColors } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function HomeScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [recentItems, setRecentItems] = useState<ContentWithCategory[]>([]);
  const [rediscoverItems, setRediscoverItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const [recent, rediscover] = await Promise.all([
        getRecentContents(3),
        getRediscoverContents(5),
      ]);
      setRecentItems(recent);
      setRediscoverItems(rediscover);
    } catch (e) {
      console.error('Home load error:', e);
    } finally {
      setLoading(false);
    }
  }, [session, isAuthLoading]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!session) return;
    return on('content-saved', loadData);
  }, [session, loadData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.appLogo}
            resizeMode="cover"
          />
          <Pressable onPress={() => router.push('/search')}>
            <SearchBar />
          </Pressable>
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Recent Saved */}
              <View style={styles.section}>
                <SectionHeader icon="time-outline" label="최근 저장" />
                {recentItems.length > 0 ? (
                  recentItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      title={item.title ?? item.url}
                      source={formatSource(item.domain)}
                      tags={item.tags}
                      thumbnailUrl={item.thumbnail_url}
                      thumbnailColor={placeholderColor(item.id)}
                      savedAt={formatRelativeTime(item.saved_at)}
                      onPress={() => router.push(`/content/${item.id}`)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>첫 콘텐츠를 저장해보세요</Text>
                )}
                {recentItems.length > 0 && (
                  <Pressable
                    onPress={() => router.push('/recent-saved')}
                    style={styles.seeAllRow}
                  >
                    <Text style={styles.seeAllText}>전체 보기</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                  </Pressable>
                )}
              </View>

              {/* Rediscover */}
              {rediscoverItems.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader
                    icon="sparkles"
                    label="Rediscover"
                    dot
                    subtitle="관심 높은 카테고리 · 미열람"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rediscoverScroll}
                  >
                    {rediscoverItems.map((item) => {
                      const colors = rediscoverColors(item.id);
                      return (
                        <RediscoverCard
                          key={item.id}
                          title={item.title ?? item.url}
                          source={formatSource(item.domain)}
                          hint={item.categories?.name ? `${item.categories.name} 카테고리` : '미분류'}
                          thumbnailUrl={item.thumbnail_url}
                          gradientDark={colors.dark}
                          gradientMid={colors.mid}
                          onPress={() => router.push(`/content/${item.id}`)}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              ) : recentItems.length > 0 ? (
                <View style={styles.rediscoverPlaceholder}>
                  <View style={styles.placeholderIcon}>
                    <Ionicons name="sparkles" size={16} color={Colors.accent} />
                  </View>
                  <View style={styles.placeholderCopy}>
                    <Text style={styles.placeholderTitle}>Rediscover 준비 중이에요</Text>
                    <Text style={styles.placeholderText}>
                      아직 열어보지 않은 저장 콘텐츠가 여기에 나타나요.
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  appLogo: {
    height: 52,
    width: 138,
    marginBottom: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 30,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 4,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondary,
  },
  rediscoverScroll: {
    gap: 11,
    paddingRight: 20,
  },
  rediscoverPlaceholder: {
    minHeight: 118,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.07)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  placeholderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderCopy: {
    flex: 1,
    gap: 4,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 17,
  },
});
