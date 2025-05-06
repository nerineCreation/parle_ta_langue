import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import type { ParentLanguage, Languages } from '../types';
import { playClickSound } from '../lib/sound'

export function LanguageManagement() {
  const navigate = useNavigate();
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activatedLanguages, setActivatedLanguages] = useState<ParentLanguage[]>([]);
  const user = useStore((state) => state.user);
  const [languages, setLanguages] = useState<Languages[]>([]);
  const soundEnabled = useStore(state => state.soundEnabled)
  const setSoundEnabled = useStore(state => state.setSoundEnabled)

  const toggle = () => {
    setSoundEnabled(!soundEnabled)
    // jouer un petit son pour feedback si on active
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
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      // Charger les langues actives
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (languagesError) throw languagesError;
      setLanguages(languagesData || []);

      // Charger les activations du parent depuis parent_languages, joint à languages_code
      const { data: parentLangData, error: parentLangError } = await supabase
        .from('parent_languages')
        .select(`*, language_code_id:languages_code(*)`)
        .eq('parent_id', user.id);
      if (parentLangError) throw parentLangError;

      // Pour chaque activation, retrouver la langue dans languagesData via languages_code.languages_id
      const transformed: ParentLanguage[] = (await Promise.all(
        (parentLangData || []).map(async (pl: any): Promise<ParentLanguage | null> => {
          const languageName = typeof pl.language_name === 'string' ? pl.language_name : pl.language_name?.name; // 🔥 S'assurer que c'est une chaîne
      
          if (!pl.language_code_id || !languageName) return null; // Vérification
      
          return {
            id: pl.id,
            parent_id: pl.parent_id,
            language_id: pl.language_code_id,
            language_name: languageName, 
            activated_at: pl.activated_at || null,
            created_at: pl.created_at || null,
          };
        })
      )).filter((pl): pl is ParentLanguage => pl !== null);
      
      setActivatedLanguages(transformed);
    } catch (error: any) {
      console.error('Erreur lors du chargement des langues:', error);
      setError('Erreur lors du chargement des langues');
    }
  };

  const handleActivateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activationCode.trim()) return;
  
    setLoading(true);
    setError('');
    setSuccess('');
  
    try {
      // Vérifier si le code d'activation existe dans languages_code et récupérer language_id
      const { data: langCode, error: langCodeError } = await supabase
        .from('languages_code')
        .select('id, language_id')
        .eq('code', activationCode.toUpperCase())
        .maybeSingle();
  
      if (langCodeError) {
        throw new Error(`Erreur lors de la vérification du code.`);
      }
  
      if (!langCode || !langCode.language_id) {
        throw new Error(`Ce code d'activation est invalide.`);
      }
  
      // Récupérer le nom de la langue depuis la table "languages" via language_id
      const { data: languageData, error: languageError } = await supabase
        .from('languages')
        .select('name')
        .eq('id', langCode.language_id)
        .maybeSingle();
  
      if (languageError) {
        throw new Error("Erreur lors de la récupération du nom de la langue.");
      }
      if (!languageData || !languageData.name) {
        throw new Error("Nom de langue introuvable.");
      }
  
      // Vérifier que le parent n'a pas déjà activé cette langue
      const { data: existingActivation, error: existingError } = await supabase
        .from('parent_languages')
        .select('id')
        .eq('language_code_id', langCode.id)
        .eq('parent_id', user.id)
        .maybeSingle();
  
      if (existingError) {
        throw new Error("Erreur lors de la vérification de l'activation.");
      }
  
      if (existingActivation) {
        throw new Error("Vous avez déjà activé cette langue.");
      }
  
      // Ajouter l'activation dans parent_languages en insérant language_name récupéré depuis la table languages
      const { error: insertError } = await supabase
        .from('parent_languages')
        .insert([{
          parent_id: user.id,
          language_code_id: langCode.id, // utilise languages_code.id
          language_name: languageData.name, // récupéré depuis la table languages
        }]);
  
      if (insertError) {
        throw new Error("Erreur lors de l'activation de la langue.");
      }
  
      setSuccess("Langue activée avec succès !");
      setActivationCode('');
  
      // Rafraîchir la liste des langues activées
      await loadData();
    } catch (error: any) {
      console.error('Error activating language:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
        {bgmUrl && (<audio src={bgmUrl} autoPlay loop muted={!soundEnabled} className="hidden" />)}
        
{/*          <button
            onClick={toggle}
            className="text-xl p-2"
            aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
*/}
          <h1 className="text-4xl font-bold text-pink">Gestion des langues</h1>
          <button onClick={() => {playClickSound(); navigate('/dashboard')}} className="btn-secondary">Retour</button>
        </div>
        <div className="grid gap-6">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Activer une nouvelle langue</h2>
            <form onSubmit={handleActivateLanguage} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              <div>
                <label htmlFor="activationCode" className="block text-sm font-medium mb-2">
                  Code d'activation
                </label>
                <input
                  id="activationCode"
                  type="text"
                  value={activationCode}
                  onChange={(e) => {
                    setActivationCode(e.target.value.toUpperCase());
                    setError('');
                    setSuccess('');
                  }}
                  className="input-field"
                  placeholder="Entrez votre code d'activation"
                  required
                  maxLength={12}
                  pattern="[A-Z0-9]{12}"
                  title="Le code doit contenir 12 caractères alphanumériques"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className={`btn-primary w-full ${loading || !activationCode.trim() || activationCode.length !== 12 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading || !activationCode.trim() || activationCode.length !== 12}
                onClick={() => playClickSound()}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Activation en cours...
                  </span>
                ) : (
                  'Activer la langue'
                )}
              </button>
            </form>
          </div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Langues activées</h2>
            {activatedLanguages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activatedLanguages.map((pl) => {
                  const language = pl.language_id;
                  if (!language) return null;
                  return (
                    <div key={pl.id} className="p-4 rounded-lg bg-pastel-pink text-center">
                      {typeof pl.language_name === 'string' ? pl.language_name : 'Nom inconnu'}

                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-600">
                Vous n'avez pas encore activé de langue. Utilisez un code d'activation pour commencer.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
