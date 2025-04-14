import { create } from 'zustand'
import { User, ChildProfile, Languages, ParentLanguage, GameProgress, Themes, ThemeGroup } from '../types'
import { supabase } from '../lib/supabase'

/* 
  Définissons un type pour la langue sélectionnée contenant l'ID et le nom.
  Vous pouvez le renommer ou l'adapter selon vos besoins.
*/
export type SelectedLanguage = {
  id: string;
  name: string;
};

interface AppState {
  user: User | null;
  currentChild: ChildProfile | null;
  children: ChildProfile[];
  languages: Languages[];
  parentLanguages: ParentLanguage[];
  // On stocke désormais un objet SelectedLanguage avec id et name
  currentLanguage: SelectedLanguage | null;
  gameProgress: GameProgress;
  theme: Themes | null;
  themeGroup: ThemeGroup | null;
  setUser: (user: User | null) => void;
  setCurrentChild: (child: ChildProfile | null) => void;
  setChildren: (children: ChildProfile[]) => void;
  setLanguages: (languages: Languages[]) => void;
  setParentLanguages: (parentLanguages: ParentLanguage[]) => void;
  // Mise à jour du setter pour currentLanguage
  setCurrentLanguage: (language: SelectedLanguage | null) => void;
  setTheme: (theme: Themes | null) => void;
  setThemeGroup: (themeGroup: ThemeGroup | null) => void;
  setGameProgress: (progress: Partial<GameProgress>) => void;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentChild: null,
  children: [],
  languages: [],
  parentLanguages: [],
  currentLanguage: null, // Valeur par défaut : aucun langage sélectionné
  theme: null,
  themeGroup: null,
  gameProgress: {
    child_id: '',
    coins: 0,
    completed_activities: [],
    unlocked_rewards: [],
  },
  setUser: (user) => set({ user }),
  setCurrentChild: (child) => set({ currentChild: child }),
  setChildren: (children) => set({ children }),
  setLanguages: (languages) => set({ languages }),
  setParentLanguages: (parentLanguages) => set({ parentLanguages }),
  // Mise à jour pour stocker un objet contenant id et name
  setCurrentLanguage: (language) => set({ currentLanguage: language }),
  setTheme: (theme) => set({ theme }),
  setThemeGroup: (themeGroup) => set({ themeGroup }),
  setGameProgress: (progress) =>
    set((state) => ({
      gameProgress: { ...state.gameProgress, ...progress },
    })),
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        currentChild: null,
        children: [],
        languages: [],
        parentLanguages: [],
        currentLanguage: null, // Reset lors de la déconnexion
        theme: null,
        themeGroup: null,
        gameProgress: {
          child_id: '',
          coins: 0,
          completed_activities: [],
          unlocked_rewards: [],
        },
      });
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },
}));
