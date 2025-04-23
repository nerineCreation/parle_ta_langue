import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function Rewards() {
  const navigate = useNavigate();
  const gameProgress = useStore((state) => state.gameProgress);
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect (() => {
    const loadLogo = async () => {
      const { data, error } = supabase
        .storage
        .from('images')       // Nom de votre bucket
        .getPublicUrl('Logo.png')  // Chemin relatif dans le bucket
      if (error) {
        console.error('Erreur lors de la récupération du logo :', error)
      } else {
        setLogoUrl(data.publicUrl)
      }
    }

    loadLogo()
  }, [])

  return (
    <div className="min-h-screen bg-background px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="bg-background px-4 py-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Parle ta langue"
              className="h-[60px] w-auto mb-6 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          )}
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold text-pink mb-4">Récompenses</h1>
            <p className="text-lg mb-4">
            Vous avez accumulé {gameProgress?.score ?? 0} pièces d'or !
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Retour
          </button>
        </div>
      </motion.div>
    </div>
  );
}
