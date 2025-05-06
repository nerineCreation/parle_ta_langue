import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '../lib/auth'
import Bubulle from '../components/Bubulle'
import { supabase } from '../lib/supabase'
import { playClickSound } from '../lib/sound'
import { useStore } from '../store'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const signupMessage = location.state?.message
  const soundEnabled = useStore(state => state.soundEnabled)
  const setSoundEnabled = useStore(state => state.setSoundEnabled)
  const audioRef = useRef<HTMLAudioElement>(null)

  const toggle = () => {
    setSoundEnabled(!soundEnabled)
    // jouer un petit son pour feedback si on active
    if (!soundEnabled) playClickSound()
    if (audioRef.current) audioRef.current.muted = soundEnabled
  }

  // **Musique d'ambiance**
  const [bgmUrl, setBgmUrl] = useState<string | null>(null)

  useEffect(() => {
    // Charger l’URL publique du fichier audio d’ambiance
    const loadBgm = async () => {
      const { data, error } = supabase
        .storage
        .from('audios')          // nom du bucket
        .getPublicUrl('accueil entier VF.wav') // nom du fichier fourni
      if (error) {
        console.error('Erreur chargement musique d’ambiance :', error)
      } else {
        setBgmUrl(data.publicUrl)
      }
    }

    loadBgm()

    // Fonction qui lance la lecture et remet le mute en accord avec soundEnabled
    const unlockAudio = () => {
      if (!audioRef.current) return
      audioRef.current.play().catch(() => {})
      audioRef.current.muted = !soundEnabled
      window.removeEventListener('touchstart', unlockAudio)
      window.removeEventListener('click', unlockAudio)
    }

    // On débloque au premier touchstart (mobile) ou click (desktop)
    window.addEventListener('touchstart', unlockAudio, { once: true })
    window.addEventListener('click', unlockAudio, { once: true })

    return () => {
      window.removeEventListener('touchstart', unlockAudio)
      window.removeEventListener('click', unlockAudio)
    }
  }, [soundEnabled])


  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setError('')
    setLoading(true)

    const response = await auth.signIn(email, password)
    
    if (response.success) {
      navigate('/dashboard', { replace: true })
    } else if (response.error) {
      setError(response.error.message)
    }
    
    setLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    const response = await auth.resetPassword(email)
    
    if (response.success) {
      setSuccess('Un email de réinitialisation vous a été envoyé')
      setIsResetting(false)
    } else if (response.error) {
      setError(response.error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* audio caché démarré muet */}
      {bgmUrl && (
        <audio
          ref={audioRef}
          src={bgmUrl}
          autoPlay
          loop
          playsInline                 // iOS inline play
          muted={!soundEnabled}      // muet si soundEnabled=false
          className="hidden"
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full"
      >
        <div className="text-center">
          <div className="relative">
            <Bubulle className="mx-auto transform hover:scale-110 transition-transform duration-200" />
          </div>
{/*          <button
            onClick={toggle}
            className="text-xl p-2"
            aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
*/}
          <h1 className="mt-6 text-3xl font-bold text-black">
            {isResetting ? 'Réinitialiser le mot de passe' : 'Bon retour parmi nous !'}
          </h1>
        </div>

        {signupMessage && !error && !isResetting && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded my-4">
            <p className="text-sm">{signupMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded my-4">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {isResetting ? (
          <form onSubmit={handleResetPassword} className="space-y-6 mt-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                disabled={loading}
                placeholder="vous@exemple.com"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                title="Veuillez entrer une adresse email valide"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsResetting(false)
                setError('')
                setSuccess('')
              }}
              className="btn-secondary w-full"
              disabled={loading}
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-6 mt-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                disabled={loading}
                placeholder="vous@exemple.com"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                title="Veuillez entrer une adresse email valide"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                disabled={loading}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            <div className="flex flex-col space-y-4">
              <button
                type="button"
                onClick={() => {
                  setIsResetting(true)
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-pink hover:text-opacity-80 transition-colors"
                disabled={loading}
              >
                Mot de passe oublié ?
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="btn-secondary w-full"
                disabled={loading}
              >
                Pas encore de compte ? Créez-en un !
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}