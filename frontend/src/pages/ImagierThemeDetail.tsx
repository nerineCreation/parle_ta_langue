import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { playClickSound } from '../lib/sound'

export function ImagierThemeDetail() {
  const navigate = useNavigate();
  const themeGroup = useStore((state) => state.themeGroup);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gameProgress = useStore((state) => state.gameProgress);
  const currentChild = useStore((state) => state.currentChild);
  const currentLanguage = useStore((state) => state.currentLanguage);
  const [themeName, setThemeName] = useState<string | null>(null);
  const soundEnabled = useStore(state => state.soundEnabled)
  const setSoundEnabled = useStore(state => state.setSoundEnabled)

  const toggle = () => {
    setSoundEnabled(!soundEnabled)
    // jouer un petit son pour feedback si on active
    if (!soundEnabled) playClickSound()
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const themeParam = params.get('theme');

    if (!currentChild) {
      navigate('/profiles');
      return;
    }

    if (!currentLanguage) {
      navigate('/dashboard');
      return;
    }

    if (themeParam) {
      setThemeName(themeParam);
    }

    if (!themeGroup) {
      setError('Aucun ID de groupe de thèmes fourni.');
      setLoading(false);
      return;
    }

    const fetchThemes = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('themes')
          .select('id, name, icon')
          .eq('theme_group_id', themeGroup)
          .eq('is_active', true)
          .order('order', { ascending: true });

        if (error) {
          throw error;
        }

        setThemes(data || []);
      } catch (err) {
        setError('Erreur lors du chargement des thèmes.');
        console.error(err);
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
        .eq('language_id', currentLanguage.id)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de la récupération de la progression du jeu :', error);
        return;
      }
      if (data) {
        useStore.getState().setGameProgress(data);
      }
    };

    fetchThemes();
    fetchGameProgress();
  }, [themeGroup]);

  const handleThemeSelection = (themeId: any) => {
    useStore.getState().setTheme(themeId);
    navigate(`/imagier-show`); // Redirige vers la page de jeu
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
{/*          <button
            onClick={toggle}
            className="text-xl p-2"
            aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
*/}
          <div>
            <h1 className="text-4xl font-bold text-pink">{themeName}</h1>
{/*            <button onClick={() => {playClickSound(); navigate('/rewards')}}
              className="text-lg btn-secondary"
            >
              Pièces d'or : {gameProgress?.score ?? 0}
            </button>
*/}
            </div>
          <button onClick={() => {playClickSound(); navigate('/imagier')}} className="btn-secondary">Retour</button>
        </div>

        <div className="card mb-6">
          {loading ? (
            <p className="text-center text-gray-600">Chargement des thèmes...</p>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : themes.length === 0 ? (
            <p className="text-center text-gray-600">Aucun thème disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {playClickSound(); handleThemeSelection(theme.id)}}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <div className="text-4xl mb-4">{theme.icon}</div>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
