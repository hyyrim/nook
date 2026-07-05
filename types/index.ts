export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type Content = {
  id: string;
  user_id: string;
  category_id: string | null;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  domain: string;
  tags: string[];
  saved_at: string;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationSettings = {
  user_id: string;
  enabled: boolean;
  unread_reminder_enabled: boolean;
  send_at_hour: number; // 0~23
  send_at_minute: number; // 0 or 30
  timezone: string;
  created_at: string;
  updated_at: string;
};

// v1.2 알림 채널. 단일 미열람 리마인더. 향후 채널 추가 시 확장.
export type NotificationType = 'unread_reminder';
