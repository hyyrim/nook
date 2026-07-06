import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Colors, Radius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/AuthProvider';
import { getAllReminders } from '@/lib/reminders';

function SettingRow({
  icon,
  label,
  danger,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: 'rgba(0,0,0,0.02)' }]}
    >
      <View style={[styles.iconBubble, danger && styles.iconBubbleDanger]}>
        <Ionicons name={icon} size={16} color={danger ? Colors.accent : Colors.secondary} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.dangerLabel]}>{label}</Text>
      {badge !== undefined && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={14} color={danger ? Colors.accent : Colors.tertiary} />
    </Pressable>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const email = user?.email ?? '';
  const initial = (user?.user_metadata?.full_name?.[0] ?? email[0] ?? 'U').toUpperCase();
  const displayName = user?.user_metadata?.full_name ?? email.split('@')[0] ?? 'User';
  const [reminderCount, setReminderCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void getAllReminders().then((list) => {
        if (!cancelled) setReminderCount(list.length);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>프로필</Text>
        </View>

        <View style={styles.content}>
          {/* User info card */}
          <Pressable
            onPress={() => router.push('/account-settings')}
            style={({ pressed }) => [styles.userCard, pressed && { backgroundColor: 'rgba(255,255,255,0.72)' }]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.tertiary} />
          </Pressable>

          <View style={styles.settingsCard}>
            <SettingRow icon="notifications-outline" label="알림 설정" onPress={() => router.push('/notification-settings')} />
            <Divider />
            <SettingRow
              icon="alarm-outline"
              label="예정된 리마인더"
              badge={reminderCount}
              onPress={() => router.push('/reminders')}
            />
          </View>

          {/* Information section */}
          <View>
            <SectionLabel text="정보" />
            <View style={styles.settingsCard}>
              <SettingRow icon="shield-checkmark-outline" label="개인정보 처리방침" onPress={() => Linking.openURL('https://nookarchive.notion.site/Nook-3800026abaeb808e9547d64c065bae52')} />
              <Divider />
              <SettingRow icon="document-text-outline" label="서비스 이용약관" onPress={() => Linking.openURL('https://nookarchive.notion.site/Nook-3800026abaeb80588420ca47be19d904')} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.6,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0DBD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12.5,
    color: Colors.secondary,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    borderRadius: 8,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleDanger: {
    backgroundColor: '#FFF0F0',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: Colors.primary,
  },
  dangerLabel: {
    color: Colors.accent,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  badge: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 7,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
