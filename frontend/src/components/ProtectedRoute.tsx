import { ReactNode, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useStore((state) => state.user)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) {
      // Navigate to login page if user is not authenticated
      navigate('/', { 
        replace: true,
        state: { from: location.pathname }
      })
    }
  }, [user, navigate, location])

  // Show loading state or null while checking authentication
  if (!user) {
    return null
  }

  return <>{children}</>
}