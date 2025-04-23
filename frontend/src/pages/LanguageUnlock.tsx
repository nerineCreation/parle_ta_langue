import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'
import Bubulle from '../components/Bubulle'

interface Language {
  id: string
  code: string
  name: string
  is_active: boolean
}

export default function LanguageUnlock() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const navigate = useNavigate()
  const currentChild = useStore((state) => state.currentChild)
  const user = useStore((state) => state.user)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!currentChild) {
      navigate('/profiles')
      return
    }

    async function loadLanguages() {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (!error && data) {
        setLanguages(data)
      }
    }
    const loadLogo = async () => {
      const { data, error } = supabase
        .storage
        .from('images')       // Nom de votre bucket
        .getPublicUrl('Logo.png')  // Chemin relatif dans le bucket
      if (error) {
        console.error('Erreur lors de la récupération du logo :', error)
      } else {
        setLogoUrl(data.publicUrl)
      }
    }

    loadLogo()
    loadLanguages()
  }, [currentChild, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !currentChild) return

    setIsLoading(true)
    setError('')

    try {
      // Vérifier si le code d'activation est valide
      const { data: parentLanguage, error: activationError } = await supabase
        .from('parent_languages')
        .select('language_id')
        .eq('parent_id', user.id)
        .eq('activation_code', code.toUpperCase())
        .single()

      if (activationError || !parentLanguage) {
        throw new Error('Code d\'activation invalide')
      }

      // Marquer la langue comme activée
      const { error: updateError } = await supabase
        .from('parent_languages')
        .update({ activated_at: new Date().toISOString() })
        .eq('parent_id', user.id)
        .eq('language_id', parentLanguage.language_id)

      if (updateError) throw updateError

      navigate('/game')
    } catch (error: any) {
      console.error('Error activating language:', error)
      setError(error.message || 'Une erreur est survenue')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-background px-4 py-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Parle ta langue"
              className="h-[60px] w-auto mb-6 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          )}
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-pink">
            Débloquer une langue
          </h1>
          <button
            onClick={() => navigate('/game')}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>

        <div className="card">
          <div className="text-center mb-8">
            <Bubulle className="mx-auto" />
            <p className="mt-4 text-gray-600">
              Entrez votre code d'activation pour débloquer une nouvelle langue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Code d'activation
              </label>
              <input
                type="text"
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input-field"
                placeholder="Entrez votre code"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activation en cours...
                </span>
              ) : (
                'Activer la langue'
              )}
            </button>
          </form>

          {languages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Langues disponibles
              </h3>
              <div className="grid gap-4">
                {languages.map((language) => (
                  <div
                    key={language.id}
                    className="p-4 bg-pastel-pink rounded-lg"
                  >
                    <span className="font-medium">{language.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}