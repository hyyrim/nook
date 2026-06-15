import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents } from '@/lib/api';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, placeholderColor } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function SearchScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [allItems, setAllItems] = useState<ContentWithCategory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading || !session) {
        setLoading(false);
        return;
      }

      (async () => {
        try {
          const data = await getRecentContents(200);
          setAllItems(data);
        } catch (e) {
          console.error('Search load error:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [session, isAuthLoading])
  );

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

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
              placeholder="아카이브 검색..."
              placeholderTextColor={Colors.tertiary}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.tertiary} />
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : query.trim().length === 0 ? (
            <Text style={styles.hintText}>제목, 출처, 태그로 검색해보세요</Text>
          ) : filtered.length > 0 ? (
            filtered.map(item => (
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 36,
  },
  hintText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
