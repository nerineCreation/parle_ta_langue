export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ChildProfile {
  id: string;
  parent_id: string;
  name: string;
  age_group: '0-3' | '4-6' | '7-11';
  created_at: string;
  language_id?: string;
}

export interface Languages {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface LanguagesCode {
  id: string;
  code: string;
  created_at: string;
  language_id?: string;
}

export interface ParentLanguage {
  id: string;
  parent_id: string;
  activated_at: string | null;
  created_at: string;
  language_id?: string;
  language_name?: string;
}

export interface Reward {
  id: string;
  child_id: string;
  type: 'image' | 'poster' | 'book';
  coins_required: number;
  is_unlocked: boolean;
  content_url: string;
}

export interface GameProgress {
  child_id: string;
  theme_id: string;
  language_id: string;
  completed_items: any; // selon le format que vous souhaitez (par exemple, un nombre ou un tableau)
  score: number;
  last_played_at: string;
  created_at: string;
};

export interface Themes {
  id: string;
  name: string;
  order: number;
  theme_group_id: string;
  created_at: string;
  icon: string;
}

export interface ThemeGroup {
  id: string;
  name: string;
  created_at: string;
  icon: string;
}