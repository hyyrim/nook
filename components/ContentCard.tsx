import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants';
import { THUMBNAIL_PLACEHOLDER } from '@/lib/utils';

type ContentCardProps = {
  title: string;
  source: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  thumbnailColor?: string;
  savedAt?: string;
  isClassifying?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onPress?: () => void;
  // 데스크탑 밀집 행: 썸네일 작게 + 제목·소스·태그·날짜를 한 줄로. 폭을 넓게 쓰되 행 높이를 낮춤.
  compact?: boolean;
};

export function ContentCard({ title, source, tags = [], thumbnailUrl, thumbnailColor = THUMBNAIL_PLACEHOLDER, savedAt, isClassifying = false, selectionMode = false, selected = false, onPress, compact = false }: ContentCardProps) {
  const isNotion = source === 'Notion';
  const thumbStyle = [styles.thumbnail, compact && styles.thumbnailCompact];

  const metaTag = isClassifying ? (
    <View style={styles.classifyingTag}>
      <View style={styles.classifyingDot} />
      <Text style={styles.classifyingText}>AI 분류 중</Text>
    </View>
  ) : tags.length > 0 ? (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{tags[0]}</Text>
    </View>
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, compact && styles.containerCompact, pressed && styles.pressed]}
    >
      {selectionMode && (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      )}
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={thumbStyle}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : isNotion ? (
        <View style={[thumbStyle, styles.notionThumbnail]}>
          <Ionicons name="document-text-outline" size={compact ? 18 : 22} color={Colors.primary} />
        </View>
      ) : (
        <View style={[thumbStyle, { backgroundColor: thumbnailColor }]} />
      )}

      {compact ? (
        // 한 줄: 제목(flex) · 소스 · 태그 · 날짜
        <View style={styles.compactRow}>
          <Text style={[styles.title, styles.titleCompact]} numberOfLines={1}>{title}</Text>
          <Text style={styles.source} numberOfLines={1}>{source}</Text>
          {metaTag}
          {savedAt && <Text style={styles.savedAt}>{savedAt}</Text>}
        </View>
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.sourceTagRow}>
              <Text style={styles.source}>{source}</Text>
              {metaTag}
            </View>
            {savedAt && <Text style={styles.savedAt}>{savedAt}</Text>}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 9,
  },
  containerCompact: {
    padding: 10,
    gap: 10,
    marginBottom: 7,
    alignItems: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  thumbnailCompact: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  notionThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  compactRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 18.5,
  },
  titleCompact: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sourceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  source: {
    fontSize: 11.5,
    color: Colors.secondary,
  },
  tag: {
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: Colors.secondary,
  },
  classifyingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  classifyingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.tertiary,
  },
  classifyingText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: Colors.tertiary,
  },
  savedAt: {
    fontSize: 11,
    color: Colors.tertiary,
  },
});
