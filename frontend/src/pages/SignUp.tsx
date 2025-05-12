import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '../lib/auth'
import Bubulle from '../components/Bubulle'
import { supabase } from '../lib/supabase'
import { playClickSound } from '../lib/sound'
import { useStore } from '../store'

interface PasswordValidation {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export function SignUp() {
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })
  const navigate = useNavigate()

  // audio
  const soundEnabled = useStore(state => state.soundEnabled)
  const setSoundEnabled = useStore(state => state.setSoundEnabled)
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
    if (!soundEnabled) playClickSound()
  }

  // bgm
  const [bgmUrl, setBgmUrl] = useState<string | null>(null)
  useEffect(() => {
    const loadBgm = async () => {
      const { data, error } = supabase
        .storage
        .from('audios')
        .getPublicUrl('accueil entier VF.wav')
      if (!error) setBgmUrl(data.publicUrl)
    }
    loadBgm()
  }, [])

  // password rules
  useEffect(() => { validatePassword(password) }, [password])
  const validatePassword = (pw: string) => {
    setPasswordValidation({
      minLength: pw.length >= 8,
      hasUpperCase: /[A-Z]/.test(pw),
      hasLowerCase: /[a-z]/.test(pw),
      hasNumber: /[0-9]/.test(pw),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pw)
    })
  }
  const isPasswordValid = () => Object.values(passwordValidation).every(Boolean)

  const validateEmail = (em: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
  
    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setError('')

    // Validation du mot de passe
    if (!isPasswordValid()) {
      setError('Le mot de passe ne respecte pas les critères de sécurité')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
  
    setLoading(true)
  

    // 1) Inscription via l’API Auth (supabase)
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2) Récupérer l’utilisateur connecté (venant tout juste d’être créé)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("Impossible de récupérer l'utilisateur :", userError)
      setLoading(false)
      return
    }

    // 3) Inscrire le pseudo dans la table profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          email,
          pseudo,
        },
      ])
    if (profileError) {
      console.error("Erreur lors de la création du profil :", profileError)
      // Vous pouvez afficher un message mais ne pas bloquer la suite
    }

    // 4) Redirection vers la page de connexion avec message
    navigate("/", {
      state: {
        message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
      },
    })
  
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* musique d'ambiance (muette) */}
      {bgmUrl && (<audio src={bgmUrl} autoPlay loop muted={!soundEnabled} className="hidden" />)}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full"
      >
        <div className="text-center">
          <Bubulle className="mx-auto transform hover:scale-110 transition-transform duration-200" />
{/*          <button
            onClick={toggleSound}
            className="text-xl mt-4"
            aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
*/}
          <h1 className="mt-6 text-3xl font-bold text-black">Rejoignez l’aventure !</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-6 mt-6">
          {/* Pseudo */}
          <div>
            <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-1">
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              className="input-field"
              required
              disabled={loading}
              placeholder="Votre pseudo"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              required
              disabled={loading}
              placeholder="vous@exemple.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              required
              disabled={loading}
              placeholder="Choisissez un mot de passe"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm space-y-1 bg-gray-50 p-3 rounded-lg"
            >
              <h3 className="font-semibold text-gray-700 mb-2">Le mot de passe doit contenir :</h3>
              <p className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}>
                ✓ Au moins 8 caractères
              </p>
              <p className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}>
                ✓ Une majuscule
              </p>
              <p className={passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}>
                ✓ Une minuscule
              </p>
              <p className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                ✓ Un chiffre
              </p>
              <p className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}>
                ✓ Un caractère spécial
              </p>
            </motion.div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`input-field ${
                confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
              }`}
              required
              disabled={loading}
              placeholder="Confirmez le mot de passe"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !isPasswordValid() || password !== confirmPassword}
          >
            {loading ? 'Création en cours…' : 'Créer mon compte'}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary w-full"
            disabled={loading}
          >
            Déjà un compte ? Connectez-vous
          </button>
        </form>
      </motion.div>
    </div>
  )
}
