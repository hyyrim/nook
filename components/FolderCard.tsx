import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import {
  CATEGORY_DEFAULT_BG,
  CATEGORY_DEFAULT_TAB,
  getCategoryColor,
  getCategoryIcon,
} from '@/constants/categoryStyle';

type FolderCardProps = {
  name: string;
  count: number;
  color?: string | null;
  icon?: string | null;
  onPress?: () => void;
};

export function FolderCard({ name, count, color, icon, onPress }: FolderCardProps) {
  const { bg, tab } = getCategoryColor(color);
  const iconName = getCategoryIcon(icon);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardItem, pressed && styles.pressed]}
    >
      <View style={styles.wrapper}>
        <View style={[styles.tab, { backgroundColor: tab }]} />
        <View style={[styles.card, { backgroundColor: bg }]}>
          <View style={styles.nameRow}>
            {iconName ? (
              <Ionicons name={iconName} size={17} color={Colors.primary} style={styles.icon} />
            ) : null}
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.count}>{count}개</Text>
          </View>
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

const styles = StyleSheet.create({
  cardItem: {
    width: '47.8%',
  },
  pressed: {
    opacity: 0.72,
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
    backgroundColor: CATEGORY_DEFAULT_TAB,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 14,
  },
  card: {
    backgroundColor: CATEGORY_DEFAULT_BG,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    height: 116,
    paddingHorizontal: 13,
    paddingTop: 18,
    paddingBottom: 13,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  nameRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 12,
    color: Colors.secondary,
  },
  addCard: {
    height: 116,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
