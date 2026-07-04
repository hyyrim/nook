import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { upsertDeviceToken } from './api';

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
