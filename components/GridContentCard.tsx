import { Image, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';

type GridContentCardProps = {
  title: string;
  source: string;
  thumbnailUrl?: string | null;
  thumbnailColor?: string;
  savedAt?: string;
  isClassifying?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

export function GridContentCard({
  title,
  source,
  thumbnailUrl,
  thumbnailColor = '#DDD7CE',
  savedAt,
  isClassifying = false,
  selectionMode = false,
  selected = false,
  onPress,
}: GridContentCardProps) {
  const isNotion = source === 'Notion';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.thumbnailWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : isNotion ? (
          <View style={[styles.thumbnail, styles.notionThumbnail]}>
            <Ionicons name="document-text-outline" size={28} color={Colors.primary} />
          </View>
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: thumbnailColor }]} />
        )}
        {selectionMode && (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.source} numberOfLines={1}>{source}</Text>
          {savedAt && <Text style={styles.savedAt} numberOfLines={1}>{savedAt}</Text>}
        </View>
        {isClassifying && (
          <View style={styles.classifyingTag}>
            <View style={styles.classifyingDot} />
            <Text style={styles.classifyingText}>AI 분류 중</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.72,
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.border,
  },
  notionThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.surface,
  },
  textContainer: {
    padding: 10,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 17.5,
    minHeight: 35,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  source: {
    fontSize: 11,
    color: Colors.secondary,
    flexShrink: 1,
  },
  savedAt: {
    fontSize: 10.5,
    color: Colors.tertiary,
  },
  classifyingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    alignSelf: 'flex-start',
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
});
