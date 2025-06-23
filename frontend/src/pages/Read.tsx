import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { playClickSound } from '../lib/sound'
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function Read() {
  const navigate = useNavigate();
  const gameProgress = useStore((state) => state.gameProgress);
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

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
{/*          {bgmUrl && (<audio src={bgmUrl} autoPlay loop muted={!soundEnabled} className="hidden" />)}

          <button
            onClick={toggle}
            className="text-xl p-2"
            aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
*/}          
          <div>
            <h1 className="text-4xl font-bold text-pink">Lecture</h1>
{/*            <button onClick={() => {playClickSound(); navigate('/rewards')}}
              className="text-lg btn-secondary"
            >
              Pièces d'or : {gameProgress?.score ?? 0}
            </button>
*/}
          </div>
          <button
            onClick={() => {playClickSound(); navigate('/games')}}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>

        <div className="card mb-6">
          <p className="text-lg mb-4"><b>Lis avec moi</b></p>

        </div>
      </motion.div>
    </div>
  );
}
