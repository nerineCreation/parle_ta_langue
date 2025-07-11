import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { supabase } from "../lib/supabase";
import { playClickSound } from '../lib/sound'

export function ImagierShow() {
  const navigate = useNavigate();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const currentChild = useStore((state) => state.currentChild);
  const themeId = useStore((state) => state.theme);
  const gameProgress = useStore((state) => state.gameProgress);
  const [images, setImages] = useState(
    [] as {
      id: string;
      url: string;
      word: string;
      fileName: string;
      audio_name: string;
    }[]
  );
  const [loading, setLoading] = useState(true);
  const soundEnabled = useStore(state => state.soundEnabled)
  const setSoundEnabled = useStore(state => state.setSoundEnabled)

  const toggle = () => {
    setSoundEnabled(!soundEnabled)
    // jouer un petit son pour feedback si on active
    if (!soundEnabled) playClickSound()
  }

  useEffect(() => {
    if (!currentChild) {
      navigate("/profiles");
      return;
    }
    if (!currentLanguage) {
      navigate("/dashboard");
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("images")
        .select("id, file_name, translate, audio_name")
        .eq("language_id", currentLanguage.id)
        .eq("theme_id", themeId)
        .order("file_name");
      if (error) {
        console.error("Erreur lors de la récupération des images :", error);
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }
      const formattedImages = data.map((img) => {
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(img.file_name);
        return {
          id: img.id,
          url: urlData.publicUrl || "",
          word: img.translate.toUpperCase(),
          fileName: img.file_name,
          audio_name: img.audio_name,
        };
      });
      setImages(formattedImages);
      setLoading(false);
    };

    const fetchGameProgress = async () => {
      if (currentChild && currentLanguage && themeId) {
        const { data, error } = await supabase
          .from("game_progress")
          .select("*")
          .eq("child_id", currentChild.id)
          .eq("language_id", currentLanguage.id)
          .eq("theme_id", themeId)
          .maybeSingle();
        if (error) {
          console.error("Erreur lors de la récupération de la progression :", error);
        } else {
          useStore.getState().setGameProgress(data);
        }
      }
    };

    fetchGameProgress();
    fetchImages();
  }, [currentChild, currentLanguage, themeId, navigate]);

  const handleReadAudio = async (audioFileName: string) => {
    // Supposons que vos fichiers audio sont dans un bucket nommé "audios".
    const { data, error } = await supabase.storage
      .from("audios")
      .getPublicUrl(audioFileName);
    if (error) {
      console.error("Erreur lors de la récupération du fichier audio :", error);
      return;
    }
    const audioUrl = data.publicUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div 
      translate="no"
      className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
         <div className="flex justify-between items-center mb-8">
{/*            <button
              onClick={toggle}
              className="text-xl p-2"
              aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
*/}
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold text-pink">Mon imagier</h1>
{/*            <button onClick={() => {playClickSound(); navigate('/rewards')}}
              className="text-lg btn-secondary"
            >
              Pièces d'or : {gameProgress?.score ?? 0}
            </button>
*/}
          </div>
          <button onClick={() => {playClickSound(); navigate(-1)}} className="btn-secondary">Retour</button>
        </div>

        <div className="card mb-6">
          <p className="text-lg mb-4"><b>Ecoute et répète avec moi !</b></p>
          {loading ? (
            <p className="text-lg text-gray-600">Chargement des images...</p>
          ) : images.length === 0 ? (
            <p className="text-lg text-gray-600">Aucune image trouvée pour ce thème.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center items-center">
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                  onClick={() => {playClickSound(); handleReadAudio(image.audio_name)}}
                  style={{ maxWidth: "200px" }}
                >
                  <div className="relative max-w-[200px] mx-auto">
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className="rounded-lg shadow-lg block w-full
                    ring-4 ring-pink ring-offset-2 ring-offset-white
                    transition-all duration-200
                    hover:ring-blue-700 hover:ring-offset-gray-100"
                  />
                    <div className="rounded-lg absolute bottom-0 left-0 w-full bg-pink bg-opacity-50 text-sm text-center py-1">
                      {image.word}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
