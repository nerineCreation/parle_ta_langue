import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '../lib/auth'
import Bubulle from '../components/Bubulle'

interface PasswordValidation {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export function SignUp() {
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

  useEffect(() => {
    validatePassword(password)
  }, [password])

  const validatePassword = (password: string) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean)
  }

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

    const response = await auth.signUp(email, password)
    
    if (response.success) {
      navigate('/', { state: { message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.' } })
    } else if (response.error) {
      setError(response.error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full"
      >
        <div className="text-center">
          <div className="relative">
            <Bubulle className="mx-auto transform hover:scale-110 transition-transform duration-200" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-black">
            Rejoignez l'aventure !
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-6 mt-6">
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
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                disabled={loading}
                placeholder="Choisissez un mot de passe"
              />
            </div>

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
                ✓ Un caractère spécial (!@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;)
              </p>
            </motion.div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={loading || !isPasswordValid() || password !== confirmPassword}
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>

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