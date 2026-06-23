import { Image, View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type RediscoverCardProps = {
  title: string;
  source: string;
  hint: string;
  thumbnailUrl?: string | null;
  placeholderColor?: string;
  onPress?: () => void;
};

export function RediscoverCard({ title, source, hint, thumbnailUrl, placeholderColor = '#DDD7CE', onPress }: RediscoverCardProps) {
  const isNotion = source === 'Notion';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.thumbnail, !thumbnailUrl && { backgroundColor: placeholderColor }]}>
        {thumbnailUrl && (
          <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        {!thumbnailUrl && isNotion && (
          <View style={styles.notionMark}>
            <Ionicons name="document-text-outline" size={28} color={Colors.secondary} />
          </View>
        )}
        <View style={styles.sourcePill}>
          <Text style={styles.sourceText}>{source}</Text>
        </View>
      </View>
      <View style={styles.textContent}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.hintRow}>
          <Ionicons name="folder-outline" size={11} color={Colors.tertiary} />
          <Text style={styles.hint}>{hint}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 188,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  thumbnail: {
    height: 104,
    justifyContent: 'flex-end',
    padding: 10,
  },
  notionMark: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcePill: {
    alignSelf: 'flex-start',
    // 흰 배경 + 다크 글자 — 연한 placeholder/임의 색상의 썸네일 모두에서 읽힘
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.secondary,
  },
  textContent: {
    padding: 11,
    paddingBottom: 12,
    gap: 7,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 17.5,
  },
  hint: {
    fontSize: 10.5,
    color: Colors.tertiary,
    lineHeight: 14,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
