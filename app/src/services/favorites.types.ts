/**
 * Favorites Types
 */

export interface FavoritesCreateInput {
  content_type: string;
  content_id: number;
  title?: string;
}

export interface FavoriteItem {
  id: number;
  user_id: number;
  content_type: string;
  content_id: number;
  title: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface FavoriteCheckResult {
  favorited: boolean;
  favorite_id: number | null;
}

export interface FavoriteListResult {
  items: FavoriteItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
