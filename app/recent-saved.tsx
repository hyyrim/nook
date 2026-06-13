import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents } from '@/lib/api';
import { formatRelativeTime, placeholderColor } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function RecentSavedScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await getRecentContents(50);
          setItems(data);
        } catch (e) {
          console.error('Recent saved load error:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={18} color={Colors.primary} />
          </Pressable>
          <Text style={styles.navTitle}>Recent Saved</Text>
          <View style={styles.navSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : items.length > 0 ? (
            items.map(item => (
              <ContentCard
                key={item.id}
                title={item.title ?? item.url}
                source={item.domain ?? 'Unknown'}
                tags={item.tags}
                thumbnailUrl={item.thumbnail_url}
                thumbnailColor={placeholderColor(item.id)}
                savedAt={formatRelativeTime(item.saved_at)}
                onPress={() => router.push(`/content/${item.id}`)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No saved content yet</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 44,
    alignItems: 'flex-start',
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  navSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 36,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
