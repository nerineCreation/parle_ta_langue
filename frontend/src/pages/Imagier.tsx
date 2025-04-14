import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

export function Imagier() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeCounts, setThemeCounts] = useState<Record<string, number>>({});
  const currentChild = useStore((state) => state.currentChild);
  const currentLanguage = useStore((state) => state.currentLanguage);
  const gameProgress = useStore((state) => state.gameProgress);
  
  useEffect(() => {
    if (!currentChild) {
      navigate('/profiles');
      return;
    }

    if (!currentLanguage) {
      navigate('/dashboard');
      return;
    }

    const loadThemes = async () => {
      setLoading(true);
      setError(null);

      try {
        // Charger les thèmes parents depuis la table "theme_group"
        const { data: parentThemes, error: parentThemesError } = await supabase
          .from('theme_group')
          .select('id, name, icon')
          .eq('is_active', 'true')
          .order('name', { ascending: true });

        if (parentThemesError) {
          console.error("Erreur lors du chargement des thèmes parents:", parentThemesError);
          setError("Une erreur s'est produite lors du chargement des thèmes.");
          return;
        }

        if (!parentThemes || parentThemes.length === 0) {
          setError("Aucun thème disponible.");
          return;
        }

        setThemes(parentThemes);

        // Charger le nombre de sous-thèmes pour chaque thème parent
        const counts: Record<string, number> = {};

        await Promise.all(
          parentThemes.map(async (theme) => {
            const { count, error } = await supabase
              .from('themes')
              .select('id', { count: 'exact', head: true })
              .eq('theme_group_id', theme.id);
        
            if (error) {
              console.error(`Erreur lors du comptage des thèmes pour ${theme.name}:`, error);
            } else {
              counts[theme.id] = count ?? 0;
            }
          })
        );

        setThemeCounts(counts);
      } catch (err) {
        console.error("Erreur inattendue :", err);
        setError("Une erreur inattendue est survenue.");
      } finally {
        setLoading(false);
      }
    };

    // Chargement de la progression de l'enfant pour le thème et la langue sélectionnés
    const fetchGameProgress = async () => {
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('child_id', currentChild.id)
        .eq('language_id', currentLanguage)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération de la progression du jeu :', error);
        return;
      }
      if (data) {
        useStore.getState().setGameProgress(data);
      }
    };

    loadThemes();
    fetchGameProgress();
  }, [currentChild, navigate]);

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
            <h1 className="text-4xl font-bold text-pink">Imagier</h1>
            <button
              onClick={() => navigate('/rewards')}
              className="text-lg btn-secondary"
            >
              Pièces d'or : {gameProgress ? gameProgress.score : 0}
            </button>
          </div>
          <button
            onClick={() => navigate(`/dashboard`)}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>

        <div className="card mb-6">
          <p className="text-lg mb-4"><b>Bienvenue dans l'imagier !</b></p>
          {loading ? (
            <p className="text-center text-gray-600">Chargement des thèmes...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((theme) => {
                const themeCount = themeCounts[theme.id] || 0;

                const handleNavigation = async () => {
                  if (themeCount > 1) {
                    // Si plusieurs sous-thèmes, on affiche le détail du groupe
                    useStore.getState().setThemeGroup(theme.id); 
                    navigate(`/imagier-theme-detail?theme=${theme.name}`);
                  } else if (themeCount === 1) {
                    // Si un seul sous-thème, on recherche son ID dans la table "themes"
                    const { data, error } = await supabase
                      .from('themes')
                      .select('id')
                      .eq('theme_group_id', theme.id)
                      .single();
                    
                    if (error || !data) {
                      console.error("Erreur lors de la récupération du thème enfant:", error);
                      return;
                    }
                    
                    useStore.getState().setTheme(data.id);
                    navigate(`/imagier-game`);
                  } else {
                    console.warn("Aucun sous-thème disponible pour ce thème.");
                  }
                };

                return (
                  <button
                    key={theme.id}
                    onClick={handleNavigation}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <div className="text-4xl mb-4">{theme.icon}</div>
                    <span>{theme.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
