import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants';

type FolderCardProps = {
  name: string;
  count: number;
  onPress?: () => void;
};

export function FolderCard({ name, count, onPress }: FolderCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardItem, pressed && styles.pressed]}
    >
      <View style={styles.wrapper}>
        <View style={styles.tab} />
        <View style={styles.card}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.count}>{count}개 저장됨</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function AddCategoryCard({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardItem,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.wrapper}>
        <View style={styles.addTab} />
        <View style={styles.addCard}>
          <Ionicons name="add" size={22} color={Colors.tertiary} />
          <Text style={styles.addText}>카테고리 추가</Text>
        </View>
      </View>
    </Pressable>
  );
}

import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  cardItem: {
    width: '47.8%',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  wrapper: {
    paddingTop: 9,
  },
  tab: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 55,
    height: 8,
    backgroundColor: '#E5E4E4',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderTopRightRadius:12,
    borderBottomLeftRadius:12,
    borderBottomRightRadius:12,
    height: 116,
    padding: 13,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 12,
    color: Colors.secondary,
    alignSelf: 'flex-end',
  },
  addCard: {
    height: 116,
    borderTopRightRadius:12,
    borderBottomLeftRadius:12,
    borderBottomRightRadius:12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addTab: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 55,
    height: 8,
    zIndex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 14,
  },
  addText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.tertiary,
  },
});
