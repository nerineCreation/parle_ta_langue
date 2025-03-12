import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'

type GameProgress = {
  child_id: string;
  theme_id: string;
  language_id: string;
  completed_items: any; // selon le format que vous souhaitez (par exemple, un nombre ou un tableau)
  score: number;
  last_played_at: string;
  created_at: string;
};

export function GameInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentChild = useStore((state) => state.currentChild);
  const currentLanguage = useStore((state) => state.currentLanguage);
  const themeId = useStore((state) => state.theme);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [activities, setActivities] = useState<
    { id: string; name: string; icon: string; path?: string }[]
  >([]);

  useEffect(() => {
    if (!currentChild) {
      navigate('/profiles');
      return;
    }
    if (!currentLanguage) {
      navigate('/dashboard');
      return;
    }

    // Chargement des activités depuis la table "activities"
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, name, icon, path')
        .eq('is_active', true);

      if (error) {
        console.error('Erreur lors de la récupération des activités :', error);
        return;
      }
      if (data) {
        setActivities(data);
      }
    };

    // Chargement de la progression de l'enfant pour le thème et la langue sélectionnés
    const fetchGameProgress = async () => {
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('child_id', currentChild.id)
        .eq('theme_id', themeId)
        .eq('language_id', currentLanguage.id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération de la progression du jeu :', error);
        return;
      }
      if (data) {
        setGameProgress(data);
      }
    };

    fetchActivities();
    fetchGameProgress();
  }, [currentChild, currentLanguage, location, navigate, themeId]);

  if (!currentChild || !currentLanguage) return null;

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
              Pièces d'or : {gameProgress ? gameProgress.score : 0}
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
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <motion.div
                key={activity.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="card cursor-pointer hover:shadow-2xl transition-shadow text-center"
                onClick={() => activity.path && navigate(activity.path)}
              >
                <div className="text-4xl mb-4">{activity.icon}</div>
                <h2 className="text-xl font-semibold">{activity.name}</h2>
              </motion.div>
            ))
          ) : (
            <p className="text-lg">Aucune activité n'est disponible</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}