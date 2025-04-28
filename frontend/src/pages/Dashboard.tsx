import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { auth } from '../lib/auth'
import type { ChildProfile, ParentLanguage } from '../types'
import { supabase } from '../lib/supabase'
import { playClickSound } from '../lib/sound'

export function Dashboard() {
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const children = useStore((state) => state.children)
  const parentLanguages = useStore((state) => state.parentLanguages)
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<ParentLanguage[]>([])
  const [bubulleUrls, setBubulleUrls] = useState<Record<string, string>>({})
  const soundEnabled = useStore(state => state.soundEnabled)
  const setSoundEnabled = useStore(state => state.setSoundEnabled)

  const toggle = () => {
    setSoundEnabled(!soundEnabled)
    // jouer un petit son pour feedback si on active
    if (!soundEnabled) playClickSound()
  }

  useEffect(() => {
    if (!user) return

    const fetchLanguages = async () => {
      const { data, error } = await supabase
        .from('parent_languages')
        .select(`
          *,
          languages_code!inner(language_id)
        `)
        .eq('parent_id', user.id)
      
      if (error) {
        console.error('Erreur lors de la récupération des langues activées:', error)
        return;
      }
      
      // Transformer les données pour correspondre à ParentLanguage
      const formattedLanguages: ParentLanguage[] = data.map(pl => ({
        id: pl.id, // ID de la table "parent_languages"
        parent_id: pl.parent_id,
        language_code_id: pl.language_code_id,
        activated_at: pl.activated_at,
        created_at: pl.created_at,
        language_name: pl.language_name,  // La colonne language_name doit être présente maintenant
        language_id: pl.languages_code?.language_id         
      }));
      
      useStore.getState().setParentLanguages(formattedLanguages);
    };

    fetchLanguages();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      // Filtrer les langues activées à partir de parentLanguages
      const activatedLanguages = parentLanguages.filter(pl => !!pl.language_id);
      setAvailableLanguages(activatedLanguages);
      
      // Si une seule langue est activée, rediriger directement vers le jeu en passant l'objet SelectedLanguage
      if (activatedLanguages.length === 1 && activatedLanguages[0].language_id) {
        useStore.getState().setCurrentChild(selectedChild);
        useStore.getState().setCurrentLanguage({
          id: activatedLanguages[0].language_id,
          name: activatedLanguages[0].language_name || "Nom inconnu"
        });
        //navigate(`/game`);
        navigate(`/imagier`);
      }
    }
  }, [selectedChild, navigate, parentLanguages]);

  useEffect(() => {
    const loadBubulleImages = async () => {
      const urls: Record<string, string> = {};
      for (const child of children) {
        const fileName = `Bubulle_${child.age_group}.png`;
        const { data, error } = await supabase
          .storage
          .from('images')
          .getPublicUrl(fileName);
        if (error) {
          console.error(`Erreur lors de la récupération de ${fileName}:`, error);
        }
        if (data?.publicUrl) {
          urls[child.id] = data.publicUrl;
        }
      }
      setBubulleUrls(urls);
    };
    if (children.length > 0) {
      loadBubulleImages();
    }
  }, [children]);

  const handleLogout = async () => {
    const response = await auth.signOut();
    if (response.success) {
      navigate('/', { replace: true });
    }
  };

  const hasActivatedLanguages = parentLanguages.some(pl => !!pl.language_id);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 py-8">
        <button
          onClick={toggle}
          className="text-xl p-2"
          aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        <h1 className="text-4xl font-bold text-pink">Tableau de bord</h1>
        <div className="space-x-4">
          <button onClick={() => {playClickSound(); handleLogout}} className="btn-secondary">Déconnexion</button>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Bienvenue, {user?.email}</h2>
          <div className="flex gap-4">
            <button onClick={() => {playClickSound(); navigate('/profiles')}} className="btn-primary">Gérer les profils enfants</button>
            <button onClick={() => {playClickSound(); navigate('/languages')}} className="btn-primary">Gérer mes langues</button>
          </div>
        </div>
        {children.length > 0 ? (
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Profils enfants</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {children.map(child => (
                <div key={child.id} className="p-4 rounded-lg bg-pastel-pink">
                  <h3 className="font-semibold">{child.name}</h3>
                  <p className="text-sm mb-2">Âge : {child.age_group}</p>
                  {bubulleUrls[child.id] && (
                    <img src={bubulleUrls[child.id]} alt={`Bubulle de ${child.name}`} className="w-16 h-16 mx-auto my-2 transform hover:scale-110 transition-transform duration-200" />
                  )}
                  <button
                    onClick={() => {playClickSound(); hasActivatedLanguages && setSelectedChild(child)}}
                    className={`btn-primary w-full text-sm ${!hasActivatedLanguages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!hasActivatedLanguages}
                  >
                    {hasActivatedLanguages ? 'Accéder à mes jeux' : 'Activez une langue pour jouer'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-lg mb-4">Vous n'avez pas encore créé de profil enfant</p>
            <button onClick={() => {playClickSound(); navigate('/profiles')}} className="btn-primary">Créer un profil</button>
          </div>
        )}
      </div>
      {selectedChild && availableLanguages.length > 1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-semibold mb-4 text-center">Choisissez une langue</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    playClickSound(); 
                    useStore.getState().setCurrentChild(selectedChild);
                    useStore.getState().setCurrentLanguage({
                      id: lang.language_id,
                      name: lang.language_name || "Nom inconnu"
                    });
                    //navigate(`/game`);
                    navigate(`/imagier`);
                  }}
                  className="btn-primary w-full"
                >
                  {lang.language_name || "Nom inconnu"}
                </button>
              ))}
            </div>
            <button onClick={() => {playClickSound(); setSelectedChild(null)}} className="btn-secondary w-full mt-4">
              Annuler
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
