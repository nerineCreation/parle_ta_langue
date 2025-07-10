// Page React : Musique

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useStore } from "../store";
import { playClickSound } from "../lib/sound";

interface Song {
  id: string;
  title: string;
  artist: string;
  image_file: string;
  audio_file: string;
  image_url: string;
  audio_url: string;
}

export function Music() {
  const navigate = useNavigate();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentLanguage?.id) return;

    const fetchSongs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, image_file, audio_file")
        .eq("language_id", currentLanguage.id);

      if (error || !data) {
        console.error("Erreur lors du chargement des chansons :", error);
        setError("Impossible de charger les musiques.");
        setLoading(false);
        return;
      }

      const formatted = data.map((song) => {
        const { data: img } = supabase.storage.from("images").getPublicUrl(song.image_file);
        const { data: audio } = supabase.storage.from("audios").getPublicUrl(song.audio_file);
        return {
          ...song,
          image_url: img?.publicUrl || "",
          audio_url: audio?.publicUrl || "",
        };
      });

      setSongs(formatted);
      setLoading(false);
    };

    fetchSongs();
  }, [currentLanguage]);

  const handlePlay = (audioUrl: string, id: string) => {
    playClickSound();
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingId(id);
    audio.onended = () => setPlayingId(null);
  };

  return (
    <div translate="no" className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-pink">Musique</h1>
          <button onClick={() => navigate(-1)} className="btn-secondary">Retour</button>
        </div>

        <div className="card mb-6">
          <p className="text-lg mb-4">Ecoute une chanson et amuse-toi à la fredonner !</p>

          {loading ? (
            <p className="text-gray-600">Chargement des chansons...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {songs.map((song) => (
                <motion.div
                  key={song.id}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-lg shadow-lg p-4 bg-white text-center cursor-pointer"
                  onClick={() => handlePlay(song.audio_url, song.id)}
                >
                  <img src={song.image_url} alt={song.title} className="w-full h-48 object-contain mb-2 rounded" />
                  <h3 className="text-lg font-bold">{song.title}</h3>
                  <p className="text-sm text-gray-600">{song.artist}</p>
                  {playingId === song.id && <p className="text-green-600 mt-2">▶ En lecture</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} // fin page musique
