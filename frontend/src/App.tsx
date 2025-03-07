import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { ChildProfiles } from './pages/ChildProfiles'
import { GameInterface } from './pages/GameInterface'
import { Imagier } from './pages/Imagier'
import { LanguageManagement } from './pages/LanguageManagement'
import LanguageUnlock from './pages/LanguageUnlock'
import { ImagierThemeDetail } from './pages/ImagierThemeDetail'
import { ImagierGame } from './pages/ImagierGame'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Rewards } from './pages/Rewards'
import { auth } from './lib/auth'

function App() {
  useEffect(() => {
    auth.initializeAuth()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profiles" element={<ProtectedRoute><ChildProfiles /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GameInterface /></ProtectedRoute>} />
        <Route path="/imagier" element={<ProtectedRoute><Imagier /></ProtectedRoute>} />
        <Route path="/languages" element={<ProtectedRoute><LanguageManagement /></ProtectedRoute>} />
        <Route path="/language-unlock" element={<ProtectedRoute><LanguageUnlock /></ProtectedRoute>} />
        <Route path="/imagier-theme-detail" element={<ProtectedRoute><ImagierThemeDetail /></ProtectedRoute>} />
        <Route path="/imagier-game" element={<ProtectedRoute><ImagierGame /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App