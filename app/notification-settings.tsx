import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Pressable,
  Linking,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { NavHeader } from '@/components/NavHeader';
import { TimePickerSheet } from '@/components/TimePickerSheet';
import { Colors, Radius } from '@/constants';
import { getNotificationSettings, upsertNotificationSettings } from '@/lib/api';
import {
  getPermissionStatus,
  requestNotificationPermission,
  syncDeviceToken,
} from '@/lib/notifications';
import type { NotificationSettings } from '@/types';

const DEFAULT_SETTINGS = {
  enabled: true,
  unread_reminder_enabled: true,
  send_at_hour: 20,
  send_at_minute: 0,
  timezone: 'Asia/Seoul',
} as const;

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(hour: number, minute: number) {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${pad(displayHour)}:${pad(minute)}`;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Pick<
    NotificationSettings,
    'enabled' | 'unread_reminder_enabled' | 'send_at_hour' | 'send_at_minute' | 'timezone'
  >>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const refreshPermission = useCallback(async () => {
    const status = await getPermissionStatus();
    setPermission(status as 'granted' | 'denied' | 'undetermined');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [current] = await Promise.all([getNotificationSettings(), refreshPermission()]);
        if (current) {
          setSettings({
            enabled: current.enabled,
            unread_reminder_enabled: current.unread_reminder_enabled,
            send_at_hour: current.send_at_hour,
            send_at_minute: current.send_at_minute,
            timezone: current.timezone,
          });
        }
      } catch (e) {
        console.warn('[notification-settings] load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshPermission]);

  // iOS 설정에서 알림 권한을 바꾼 뒤 앱으로 돌아오면 배너 상태를 즉시 반영.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        refreshPermission();
        syncDeviceToken().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const patch = useCallback(
    async (partial: Partial<typeof settings>) => {
      const previous = settings;
      setSettings({ ...settings, ...partial });
      try {
        await upsertNotificationSettings(partial);
      } catch (e) {
        setSettings(previous);
        Alert.alert('알림 설정을 저장하지 못했어요', '잠시 후 다시 시도해주세요.');
      }
    },
    [settings],
  );

  const handleEnableMaster = useCallback(
    async (next: boolean) => {
      if (next && permission !== 'granted') {
        const status = await requestNotificationPermission();
        setPermission(status as 'granted' | 'denied' | 'undetermined');
        if (status !== 'granted') {
          Alert.alert(
            '알림 권한이 필요해요',
            'iOS 설정에서 Nook 알림을 허용해주세요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '설정 열기', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
        syncDeviceToken().catch((e) => console.warn('[notification] token sync failed', e));
      }
      patch({ enabled: next });
    },
    [permission, patch],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerWrap}>
          <NavHeader title="알림 설정" backLabel="프로필" onBack={() => router.back()} />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={Colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  const showPermissionBanner = permission === 'denied' && settings.enabled;
  const subDisabled = !settings.enabled;
  const timeDisabled = !settings.enabled;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <NavHeader title="알림 설정" backLabel="프로필" onBack={() => router.back()} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showPermissionBanner ? (
          <Pressable onPress={() => Linking.openSettings()} style={styles.banner}>
            <Text style={styles.bannerText}>
              iOS 설정에서 알림이 꺼져 있어요. 눌러서 설정 열기
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.content}>
          <View>
            <SectionLabel text="알림" />
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>전체 알림</Text>
                  <Text style={styles.settingDescription}>
                    Nook의 모든 알림을 켜고 끕니다
                  </Text>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={handleEnableMaster}
                  trackColor={{ false: '#D8D8D8', true: '#1A1A1A' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D8D8D8"
                />
              </View>
            </View>
          </View>

          <View>
            <SectionLabel text="알림 종류" />
            <View style={[styles.settingsCard, subDisabled && styles.settingsCardDisabled]}>
              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, subDisabled && styles.settingLabelDisabled]}>
                    미열람 리마인더
                  </Text>
                  <Text style={styles.settingDescription}>
                    저장했지만 열어보지 않은 링크가 쌓이면 주 1회 알려드려요
                  </Text>
                </View>
                <Switch
                  value={settings.unread_reminder_enabled}
                  onValueChange={(v) => patch({ unread_reminder_enabled: v })}
                  disabled={subDisabled}
                  trackColor={{ false: '#D8D8D8', true: '#1A1A1A' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D8D8D8"
                />
              </View>
            </View>
          </View>

          <View>
            <SectionLabel text="발송 시간" />
            <Pressable
              onPress={() => !timeDisabled && setShowTimePicker(true)}
              style={[styles.settingsCard, timeDisabled && styles.settingsCardDisabled]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, timeDisabled && styles.settingLabelDisabled]}>
                    {formatTime(settings.send_at_hour, settings.send_at_minute)}
                  </Text>
                  <Text style={styles.settingDescription}>
                    선택한 시간대에 발송해요 (30분 단위)
                  </Text>
                </View>
                <Text style={[styles.chevron, timeDisabled && styles.chevronDisabled]}>›</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <TimePickerSheet
        visible={showTimePicker}
        hour={settings.send_at_hour}
        minute={settings.send_at_minute}
        onClose={() => setShowTimePicker(false)}
        onSelect={(slot) => patch({ send_at_hour: slot.hour, send_at_minute: slot.minute })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: '#FFF0F0',
  },
  bannerText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
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
  settingsCardDisabled: {
    opacity: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  settingText: {
    flex: 1,
    gap: 3,
  },
  settingLabel: {
    fontSize: 14.5,
    fontWeight: '500',
    color: Colors.primary,
  },
  settingLabelDisabled: {
    color: Colors.secondary,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 22,
    color: Colors.tertiary,
    fontWeight: '300',
    marginTop: -2,
  },
  chevronDisabled: {
    color: Colors.tertiary,
  },
});
