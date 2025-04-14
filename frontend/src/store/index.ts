import { create } from 'zustand'
import { User, ChildProfile, Languages, ParentLanguage, GameProgress, LanguagesCode, Themes, ThemeGroup } from '../types'
import { supabase } from '../lib/supabase'

interface AppState {
  user: User | null
  currentChild: ChildProfile | null
  children: ChildProfile[]
  languages: Languages[]
  parentLanguages: ParentLanguage[]
  currentLanguage: LanguagesCode | null  // Ajout du currentLanguage
  gameProgress: GameProgress
  theme: Themes | null 
  themeGroup: ThemeGroup | null
  setUser: (user: User | null) => void
  setCurrentChild: (child: ChildProfile | null) => void
  setChildren: (children: ChildProfile[]) => void
  setLanguages: (languages: Languages[]) => void
  setParentLanguages: (parentLanguages: ParentLanguage[]) => void
  setCurrentLanguage: (language: LanguagesCode | null) => void  // Ajout du setter
  setTheme: (theme: Themes | null) => void 
  setThemeGroup: (themeGroup: ThemeGroup | null) => void 
  setGameProgress: (progress: Partial<GameProgress>) => void
  logout: () => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentChild: null,
  children: [],
  languages: [],
  parentLanguages: [],
  currentLanguage: null, // Valeur par défaut
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
  setCurrentLanguage: (language) => set({ currentLanguage: language }), // Setter ajouté
  setTheme: (theme) => set({ theme }),
  setThemeGroup: (themeGroup) => set({themeGroup}),
  setGameProgress: (progress) =>
    set((state) => ({
      gameProgress: { ...state.gameProgress, ...progress },
    })),
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

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
        }
      })
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  },
}))
