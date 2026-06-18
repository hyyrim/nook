import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants';

type IconName = keyof typeof Ionicons.glyphMap;

type RightAction =
  | { type: 'icon'; icon: IconName; onPress: () => void; disabled?: boolean }
  | { type: 'text'; label: string; onPress: () => void; disabled?: boolean; danger?: boolean };

type Props = {
  title: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: RightAction;
};

const SIDE_MIN_WIDTH = 70;

export function NavHeader({ title, backLabel, onBack, rightAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            {backLabel ? <Text style={styles.backLabel}>{backLabel}</Text> : null}
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={[styles.side, styles.sideRight]}>
        {rightAction ? <RightActionView action={rightAction} /> : null}
      </View>
    </View>
  );
}

function RightActionView({ action }: { action: RightAction }) {
  if (action.type === 'icon') {
    return (
      <Pressable
        onPress={action.onPress}
        style={styles.iconButton}
        hitSlop={8}
        disabled={action.disabled}
      >
        <Ionicons
          name={action.icon}
          size={22}
          color={action.disabled ? Colors.tertiary : Colors.primary}
        />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={action.onPress}
      style={styles.textButton}
      hitSlop={8}
      disabled={action.disabled}
    >
      <Text
        style={[
          styles.textButtonLabel,
          action.danger && { color: Colors.accent },
          action.disabled && { color: Colors.tertiary },
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  side: {
    minWidth: SIDE_MIN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 44,
  },
  backLabel: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '500',
  },
  title: {
    ...Typography.navTitle,
    flex: 1,
    color: Colors.primary,
    textAlign: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  textButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});
