import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { ErrorState } from '@/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents } from '@/lib/api';
import { isClassifying, on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };
type TransitionEndEvent = { data?: { closing?: boolean } };
type StackTransitionNavigation = {
  addListener: (event: 'transitionEnd', callback: (event: TransitionEndEvent) => void) => () => void;
};

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [allItems, setAllItems] = useState<ContentWithCategory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const loadData = useCallback(async () => {
    if (isAuthLoading || !session) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    try {
      const data = await getRecentContents(200);
      setAllItems(data);
    } catch (e) {
      console.error('Search load error:', e);
      setLoadError(true);
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
    return on('content-classified', loadData);
  }, [session, loadData]);

  useEffect(() => {
    const stackNavigation = navigation as unknown as StackTransitionNavigation;
    const unsubscribe = stackNavigation.addListener('transitionEnd', (event) => {
      if (event.data?.closing) return;

      inputRef.current?.focus();
    });

    return unsubscribe;
  }, [navigation]);

  const filtered = query.trim().length === 0
    ? []
    : allItems.filter((item) => {
        const q = query.toLowerCase();
        const title = (item.title ?? '').toLowerCase();
        const domain = (item.domain ?? '').toLowerCase();
        const tags = (item.tags ?? []).join(' ').toLowerCase();
        return title.includes(q) || domain.includes(q) || tags.includes(q);
      });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={18} color={Colors.primary} />
          </Pressable>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={15} color={Colors.tertiary} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="저장한 콘텐츠 찾기"
              placeholderTextColor={Colors.tertiary}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close" size={16} color={Colors.tertiary} />
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.list, query.trim().length === 0 && !loading && styles.emptySearchList]}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : loadError ? (
            <ErrorState onRetry={loadData} />
          ) : query.trim().length === 0 ? (
            <Text style={styles.hintText}>제목, 출처, 태그로 찾아보세요</Text>
          ) : filtered.length > 0 ? (
            filtered.map(item => (
              <ContentCard
                key={item.id}
                title={item.title ?? item.url}
                source={formatSource(item.domain)}
                tags={item.tags}
                thumbnailUrl={item.thumbnail_url}
                thumbnailColor={THUMBNAIL_PLACEHOLDER}
                savedAt={formatRelativeTime(item.saved_at)}
                isClassifying={isClassifying(item.id)}
                onPress={() => router.push({
                  pathname: '/content/[id]',
                  params: { id: item.id, source: 'search' },
                })}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>"{query}"에 대한 결과가 없어요</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: Colors.primary,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 36,
  },
  emptySearchList: {
    flex: 1,
    paddingTop: 118,
  },
  hintText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 160,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
