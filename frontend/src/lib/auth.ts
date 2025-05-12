import { supabase } from './supabase'
import { useStore } from '../store'

export interface AuthError {
  message: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
}

export const auth = {
  async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await this.handleAuthStateChange(session.user)
    }
  },

  async handleAuthStateChange(user: any) {
    try {
      // Vérifier si le profil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
        return false
      }

      // Créer le profil s'il n'existe pas
      if (!profile) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email!,
          }])

        if (createError) {
          console.error('Error creating profile:', createError)
          return false
        }
      }

      // Charger les profils enfants
      const { data: childProfiles, error: childrenError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true })

      if (childrenError) {
        console.error('Error fetching child profiles:', childrenError)
        return false
      }

      // Charger les langues activées
      const { data: parentLanguages, error: languagesError } = await supabase
        .from('parent_languages')
        .select(`
          *,
          language_code_id:languages_code (*)
        `)
        .eq('parent_id', user.id)

      if (languagesError) {
        console.error('Error fetching parent languages:', languagesError)
        return false
      }

      // Mettre à jour le store
      useStore.setState({
        user: {
          id: user.id,
          email: user.email!,
          pseudo: profile.pseudo!,
          created_at: user.created_at,
        },
        children: childProfiles || [],
        parentLanguages: parentLanguages || []
      })

      return true
    } catch (error) {
      console.error('Error in auth state change:', error)
      return false
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) throw error

      const success = await this.handleAuthStateChange(data.user)
      if (!success) {
        throw new Error('Erreur lors de l\'initialisation de la session')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      return {
        success: false,
        error: {
          message: error.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect'
            : error.message || 'Une erreur est survenue'
        }
      }
    }
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        if (error.message === 'User already registered') {
          throw new Error('Un compte existe déjà avec cette adresse email. Veuillez vous connecter.')
        }
        throw error
      }

      return { success: true }
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error)
      return {
        success: false,
        error: {
          message: error.message || 'Une erreur est survenue'
        }
      }
    }
  },

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Erreur de réinitialisation:', error)
      return {
        success: false,
        error: {
          message: error.message || 'Une erreur est survenue'
        }
      }
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      useStore.setState({ 
        user: null, 
        children: [], 
        parentLanguages: [],
        currentChild: null,
        gameProgress: {
          child_id: '',
          coins: 0,
          completed_activities: [],
          unlocked_rewards: []
        }
      })

      return { success: true }
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error)
      return {
        success: false,
        error: {
          message: error.message || 'Une erreur est survenue'
        }
      }
    }
  }
}