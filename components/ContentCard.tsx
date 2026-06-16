import { Image, View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants';

type ContentCardProps = {
  title: string;
  source: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  thumbnailColor?: string;
  savedAt?: string;
  isClassifying?: boolean;
  onPress?: () => void;
};

export function ContentCard({ title, source, tags = [], thumbnailUrl, thumbnailColor = '#DDD7CE', savedAt, isClassifying = false, onPress }: ContentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, { backgroundColor: thumbnailColor }]} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.sourceTagRow}>
            <Text style={styles.source}>{source}</Text>
            {isClassifying ? (
              <View style={styles.classifyingTag}>
                <View style={styles.classifyingDot} />
                <Text style={styles.classifyingText}>AI 분류 중</Text>
              </View>
            ) : tags.length > 0 ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tags[0]}</Text>
              </View>
            ) : null}
          </View>
          {savedAt && <Text style={styles.savedAt}>{savedAt}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
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
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 18.5,
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
    borderRadius: 100,
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
    borderRadius: 100,
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
