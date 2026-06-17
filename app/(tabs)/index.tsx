import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { RediscoverCard } from '@/components/RediscoverCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents, getRediscoverContents } from '@/lib/api';
import { isClassifying, on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, placeholderColor, rediscoverColor } from '@/lib/utils';
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
        getRediscoverContents(10),
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
    const offSaved = on('content-saved', loadData);
    const offClassified = on('content-classified', loadData);
    return () => {
      offSaved();
      offClassified();
    };
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
          <Pressable
            onPress={() => router.push('/search')}
            style={styles.searchButton}
            hitSlop={8}
          >
            <Ionicons name="search-outline" size={21} color={Colors.secondary} />
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
                      isClassifying={isClassifying(item.id)}
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
                    label="발견된 콘텐츠"
                    dot
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rediscoverScroll}
                  >
                    {rediscoverItems.map((item) => {
                      const color = rediscoverColor(item.id);
                      return (
                        <RediscoverCard
                          key={item.id}
                          title={item.title ?? item.url}
                          source={formatSource(item.domain)}
                          hint={item.categories?.name ?? '미분류'}
                          thumbnailUrl={item.thumbnail_url}
                          gradientDark={color}
                          onPress={() => router.push(`/content/${item.id}`)}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              ) : recentItems.length > 0 ? (
                <View style={styles.rediscoverPlaceholder}>
                  <Ionicons name="sparkles-outline" size={28} color={Colors.tertiary} />
                  <Text style={styles.placeholderTitle}>지금은 발견된 콘텐츠가 없어요</Text>
                  <Text style={styles.placeholderText}>
                    열어보지 않은 관심 콘텐츠가 생기면 여기에 나타나요.
                  </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  appLogo: {
    height: 42,
    width: 110,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.tertiary,
    lineHeight: 17,
    textAlign: 'center',
  },
});
