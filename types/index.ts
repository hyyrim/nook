export type Category = {
  id: string;
  user_id: string;
  name: string;
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
