import * as SecureStore from 'expo-secure-store';

const CONTENT_VIEW_TYPE_KEY = 'category_content_view_type';

export type ContentViewType = 'grid' | 'list';

export async function getContentViewType(): Promise<ContentViewType> {
  try {
    const val = await SecureStore.getItemAsync(CONTENT_VIEW_TYPE_KEY);
    return val === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

export async function setContentViewType(type: ContentViewType): Promise<void> {
  try {
    await SecureStore.setItemAsync(CONTENT_VIEW_TYPE_KEY, type);
  } catch {
    // silent — preference is not critical
  }
}
