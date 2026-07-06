import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { getCategories, isDuplicateContentUrlError, saveContent } from '@/lib/api';
import { emit } from '@/lib/events';
import { onAppActive, onAppBackground } from '@/lib/analytics';
import { syncDeviceToken, useNotificationRouting } from '@/lib/notifications';
import { useClipboardSavePrompt } from '@/lib/useClipboardSavePrompt';
import { ToastProvider, useToast } from '@/lib/toast';
import { ClipboardSavePrompt } from '@/components/ClipboardSavePrompt';
import { Colors } from '@/constants';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const savingRef = useRef(false);
  const toast = useToast();

  const inAuthFlow =
    segments[0] === 'onboarding' ||
    segments[0] === 'choose-interests' ||
    segments[0] === 'notification-permission';

  // Auth 라우팅 가드
  useEffect(() => {
    if (isLoading) return;

    if (!session && !inAuthFlow) {
      router.replace('/onboarding');
    } else if (session && (segments[0] === 'onboarding' || segments[0] === 'choose-interests')) {
      // 카테고리 존재 여부 확인 후 분기. notification-permission은 이미 카테고리 생성 후 도달하므로 가드 대상 제외.
      getCategories()
        .then((categories) => {
          if (categories.length > 0) {
            router.replace('/(tabs)');
          } else if (segments[0] !== 'choose-interests') {
            router.replace('/choose-interests');
          }
        })
        .catch(() => {
          if (segments[0] !== 'choose-interests') {
            router.replace('/choose-interests');
          }
        });
    }
  }, [session, isLoading, segments]);

  // 푸시 알림 탭 → 딥링크 라우팅. 세션이 있을 때만 활성.
  useNotificationRouting(Boolean(session));

  // 클립보드 저장 프롬프트 — 앱 진입 시 URL 발견하면 저장 시트 노출.
  // Share Intent 처리 중 / 인증·온보딩 흐름 / 로그아웃 상태에서는 skip.
  const clipboardPrompt = useClipboardSavePrompt(
    Boolean(session) && !hasShareIntent && !inAuthFlow,
  );

  // 세션 활성 + AppState 변화 → app_opened 발화 (analytics §12.2)
  // onAppActive 내부에서 30초 background 룰로 dedup하므로 중복 호출 안전.
  useEffect(() => {
    if (!session) return;

    const detectSource = () => (hasShareIntent ? 'share_sheet' : 'direct');
    onAppActive(detectSource());

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') onAppActive(detectSource());
      else if (status === 'background') onAppBackground();
    });

    return () => subscription.remove();
  }, [session, hasShareIntent]);

  // 세션 활성 → 푸시 토큰 동기화. 권한 없으면 조용히 skip.
  useEffect(() => {
    if (!session) return;
    syncDeviceToken().catch((e) => console.warn('[push] token sync failed', e));
  }, [session]);

  // Share Intent 처리: 공유된 URL 자동 저장
  useEffect(() => {
    if (!hasShareIntent || !session || savingRef.current) return;

    // §040: Threads 등 일부 플랫폼은 서버 사이드 OG로 본문 캡션을 노출하지 않는다.
    // meta.title 등 share intent 페이로드에 본문이 들어오는지 실기기 진단용.
    if (__DEV__) {
      console.log('[ShareIntent payload]', JSON.stringify(shareIntent, null, 2));
    }

    const url = shareIntent?.webUrl || shareIntent?.text;
    if (!url) {
      resetShareIntent();
      return;
    }

    savingRef.current = true;
    toast.show('저장 중...', 'loading', { duration: null });

    // Safari 공유 시 share extension이 페이지 head meta(클라이언트 렌더 후)를 전달한다.
    // 일부 플랫폼(Threads 등)은 SSR에 누락된 정보가 여기에 들어있어 saveContent에 위임.
    saveContent(
      { url },
      {
        entry_source: 'share_sheet',
        shareIntentMeta: shareIntent?.meta ?? null,
      },
    )
      .then(() => {
        emit('content-saved');
        toast.show('저장 완료!', 'success');
      })
      .catch((e: unknown) => {
        const msg = isDuplicateContentUrlError(e)
          ? '이미 저장된 링크예요'
          : '저장에 실패했어요';
        toast.show(msg, 'error');
      })
      .finally(() => {
        savingRef.current = false;
        resetShareIntent();
      });
  }, [hasShareIntent, session]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Colors.tertiary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="content/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="recent-saved"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="rediscover"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="forgotten"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="search"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="account-settings"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="choose-interests"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="notification-permission"
          options={{ animation: 'slide_from_right', gestureEnabled: false }}
        />
      </Stack>
      <ClipboardSavePrompt
        visible={Boolean(clipboardPrompt.promptUrl)}
        url={clipboardPrompt.promptUrl ?? ''}
        saving={clipboardPrompt.saving}
        onSave={clipboardPrompt.save}
        onDismiss={clipboardPrompt.dismiss}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
