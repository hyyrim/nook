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
  forgotten_enabled: boolean;
  rediscover_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type NotificationType = 'forgotten' | 'rediscover';
