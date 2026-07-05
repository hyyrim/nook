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
  forgotten_enabled: true,
  rediscover_enabled: true,
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  timezone: 'Asia/Seoul',
} as const;

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
};

function ToggleRow({ label, description, value, disabled, onValueChange }: ToggleRowProps) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.settingDescription}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D8D8D8', true: '#1A1A1A' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D8D8D8"
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Pick<
    NotificationSettings,
    'enabled' | 'forgotten_enabled' | 'rediscover_enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'
  >>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

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
            forgotten_enabled: current.forgotten_enabled,
            rediscover_enabled: current.rediscover_enabled,
            quiet_hours_start: current.quiet_hours_start,
            quiet_hours_end: current.quiet_hours_end,
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
        // 권한 획득 후 토큰 동기화
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
              <ToggleRow
                label="전체 알림"
                description="Forgotten과 Rediscover 알림을 한 번에 켜고 끕니다"
                value={settings.enabled}
                onValueChange={handleEnableMaster}
              />
            </View>
          </View>

          <View>
            <SectionLabel text="종류" />
            <View style={styles.settingsCard}>
              <ToggleRow
                label="잊혀진 링크"
                description="30일 이상 열어보지 않은 저장 링크를 알려드려요"
                value={settings.forgotten_enabled}
                disabled={subDisabled}
                onValueChange={(v) => patch({ forgotten_enabled: v })}
              />
              <Divider />
              <ToggleRow
                label="다시 볼만한 링크"
                description="관심 카테고리에서 한동안 열어보지 않은 링크를 추천해요"
                value={settings.rediscover_enabled}
                disabled={subDisabled}
                onValueChange={(v) => patch({ rediscover_enabled: v })}
              />
            </View>
          </View>

          <View>
            <SectionLabel text="발송 시간" />
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>매일 09:00 (KST)</Text>
                  <Text style={styles.settingDescription}>
                    조용한 시간(22시~08시)에는 알림을 보내지 않아요
                  </Text>
                </View>
              </View>
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  settingRowDisabled: {
    opacity: 0.5,
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
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
});
