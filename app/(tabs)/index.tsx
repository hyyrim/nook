import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
import { formatRelativeTime, placeholderColor, rediscoverColors } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function HomeScreen() {
  const router = useRouter();
  const [recentItems, setRecentItems] = useState<ContentWithCategory[]>([]);
  const [rediscoverItems, setRediscoverItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Nook</Text>
          <SearchBar />
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Recent Saved */}
              <View style={styles.section}>
                <SectionHeader icon="time-outline" label="Recent Saved" />
                {recentItems.length > 0 ? (
                  recentItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      title={item.title ?? item.url}
                      source={item.domain ?? 'Unknown'}
                      tags={item.tags}
                      thumbnailColor={placeholderColor(item.id)}
                      savedAt={formatRelativeTime(item.saved_at)}
                      onPress={() => router.push(`/content/${item.id}`)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>Save your first content to get started</Text>
                )}
                {recentItems.length > 0 && (
                  <Pressable
                    onPress={() => router.push('/recent-saved')}
                    style={styles.seeAllRow}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                  </Pressable>
                )}
              </View>

              {/* Rediscover */}
              {rediscoverItems.length > 0 && (
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
                          source={item.domain ?? 'Unknown'}
                          hint={item.categories?.name ? `From ${item.categories.name}` : 'Uncategorized'}
                          gradientDark={colors.dark}
                          gradientMid={colors.mid}
                          onPress={() => router.push(`/content/${item.id}`)}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              )}
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
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 14,
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
});
