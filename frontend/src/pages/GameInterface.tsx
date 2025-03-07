import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'


export function GameInterface() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentChild = useStore((state) => state.currentChild)
  const gameProgress = useStore((state) => state.gameProgress)
  const currentLanguage = useStore((state) => state.currentLanguage);
  const [activities, setActivities] = useState<{ id: string; name: string; icon: string; path?: string }[]>([])

  useEffect(() => {
    if (!currentChild) {
      navigate('/profiles')
      return
    }

    if (!currentLanguage) {
      navigate('/dashboard')
      return
    }

    // Chargement des activités depuis la table "activities"
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, name, icon, path')
        .eq('is_active', true) // Filtrer uniquement les activités actives

      if (error) {
        console.error('Erreur lors de la récupération des activités :', error)
        return
      }

      if (data) {
        setActivities(data)
      }
    }

    fetchActivities()
  }, [currentChild, currentLanguage, location, navigate])

  if (!currentChild || !currentLanguage) return null

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pink">Bienvenue {currentChild.name}</h1>
            <button
              onClick={() => navigate('/rewards')}
              className="text-lg btn-secondary"
            >
              Pièces d'or : {gameProgress.coins}
            </button>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-center justify-center">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card cursor-pointer hover:shadow-2xl transition-shadow text-center"
              onClick={() => activity.path && navigate(activity.path)}
            >
              <div className="text-4xl mb-4">
                {activity.icon}
                <h2 className="text-xl font-semibold">{activity.name}</h2>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}