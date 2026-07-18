import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { markNotificationOpened, upsertDeviceToken } from './api';

/** 앱이 포그라운드일 때 배너/사운드 노출. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * 알림 권한 요청. 이미 결정된 상태(granted/denied)라면 재요청하지 않고 결과만 반환.
 * 시뮬레이터에서는 항상 granted로 취급하지만 실제 토큰은 발급되지 않음.
 */
export async function requestNotificationPermission(): Promise<Notifications.PermissionStatus> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== 'undetermined') return current.status;

  const request = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: false,
    },
  });
  return request.status;
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

function resolveProjectId(): string | undefined {
  const easProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof easProjectId === 'string' && easProjectId.length > 0) return easProjectId;
  return undefined;
}

/**
 * 앱 시작 시(세션 존재) 호출. 권한이 있으면 토큰을 발급받아 서버에 upsert.
 * 실기기가 아니거나 권한 없으면 조용히 스킵.
 */
export async function syncDeviceToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const status = await getPermissionStatus();
  if (status !== 'granted') return null;

  const projectId = resolveProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResult.data;
  if (!token) return null;

  await upsertDeviceToken({
    expoPushToken: token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    deviceName: Device.deviceName ?? null,
  });

  return token;
}

type NotificationType = 'unread_reminder' | 'reminder';

type NotificationDataPayload = {
  type?: NotificationType;
  log_id?: string;
  content_id?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function resolveRoute(data: NotificationDataPayload): string | null {
  // 유저 지정 콘텐츠 리마인더: 해당 상세로 이동. 소스 표시로 리마인더 진입 구분.
  if (data.type === 'reminder' && isUuid(data.content_id)) {
    return `/content/${data.content_id}?source=direct`;
  }
  // v1.2 미열람 리마인더: 알림에 포함된 후보 리스트 전용 화면. log_id 없거나 형식 이상하면 홈 fallback.
  if (data.type === 'unread_reminder') {
    return isUuid(data.log_id) ? `/unread-reminder?log_id=${data.log_id}` : '/(tabs)';
  }
  return null;
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  push: (path: string) => void,
) {
  const data = (response.notification.request.content.data ?? {}) as NotificationDataPayload;
  const target = resolveRoute(data);
  if (target) push(target);
  if (data.log_id) {
    markNotificationOpened(data.log_id).catch(() => {});
  }
}

/**
 * 알림 탭 → 딥링크 라우팅. `_layout.tsx`에서 세션 활성 여부로 gate.
 * - 앱이 실행 중일 때 탭: `addNotificationResponseReceivedListener`가 처리
 * - 앱이 종료 상태에서 탭으로 실행됨: `getLastNotificationResponseAsync`가 mount 시 반환
 */
export function useNotificationRouting(active: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const push = (path: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(path as any);
    };

    // Cold start: 앱이 종료 상태에서 알림 탭으로 실행된 경우
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationResponse(response, push);
      })
      .catch(() => {});

    // 실행 중 탭
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response, push);
    });

    return () => subscription.remove();
  }, [active, router]);
}

