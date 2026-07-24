import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Colors, Radius } from '@/constants';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  requestNotificationPermission,
  syncDeviceToken,
} from '@/lib/notifications';
import { upsertNotificationSettings } from '@/lib/api';

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);

  const handleAllow = async () => {
    setAsking(true);
    try {
      const status = await requestNotificationPermission();
      if (status === 'granted') {
        // 서버에 알림 설정 row 생성 + 토큰 등록. 실패는 조용히 스킵.
        upsertNotificationSettings({ enabled: true }).catch(() => {});
        syncDeviceToken().catch(() => {});
      }
    } finally {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    if (asking) return;
    upsertNotificationSettings({ enabled: false }).catch(() => {});
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Sparkles size={30} color={Colors.primary} strokeWidth={1.6} />
          </View>
          <Text style={styles.title}>다시 발견할{"\n"}준비 됐어요</Text>
          <Text style={styles.description}>
            일주일 넘게 안 본 링크가 쌓이면{"\n"}
            원하는 시간에 조용히 모아 알려드릴게요.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="알림 받기"
            onPress={handleAllow}
            loading={asking}
            style={styles.cta}
            labelStyle={styles.ctaText}
          />
          <Pressable onPress={handleSkip} hitSlop={10} style={styles.skipButton} disabled={asking}>
            <Text style={[styles.skipText, asking && styles.skipTextDisabled]}>나중에</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    color: Colors.secondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actions: {
    gap: 14,
    paddingBottom: 8,
  },
  cta: {
    paddingVertical: 16,
  },
  ctaText: {
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: Colors.secondary,
  },
  skipTextDisabled: {
    color: Colors.tertiary,
  },
});
