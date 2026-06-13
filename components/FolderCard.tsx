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
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View style={styles.wrapper}>
        <View style={styles.tab} />
        <View style={styles.card}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.count}>{count} saved</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function AddCategoryCard({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.addCard, pressed && { backgroundColor: 'rgba(0,0,0,0.015)' }]}
    >
      <Ionicons name="add" size={22} color={Colors.tertiary} />
      <Text style={styles.addText}>Add Category</Text>
    </Pressable>
  );
}

import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  wrapper: {
    paddingTop: 9,
  },
  tab: {
    position: 'absolute',
    top: 0,
    left: 13,
    width: 44,
    height: 11,
    backgroundColor: '#E5E4E4',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
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
    height: 126,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C8C8C8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.tertiary,
  },
});
