import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { playClickSound } from '../lib/sound';

interface GameItem {
  id: string;
  word: string;
  image_url: string;
  isCorrect: boolean;
}

export function Game() {
  const navigate = useNavigate();
  const currentLanguage = useStore((state) => state.currentLanguage);

  const [allItems, setAllItems] = useState<GameItem[]>([]);
  const [roundItems, setRoundItems] = useState<GameItem[]>([]);
  const [targetWord, setTargetWord] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [selectedWrongId, setSelectedWrongId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!currentLanguage?.id) {
      setError("Langue non définie.");
      return;
    }

    const { data, error } = await supabase
      .from("images")
      .select("id, translate, file_name")
      .eq("language_id", currentLanguage.id);

    if (error) {
      console.error("Erreur lors du chargement des images :", error);
      setError("Erreur lors du chargement des images.");
      return;
    }

    if (!data || data.length < 3) {
      setError("Pas assez d’images pour jouer.");
      return;
    }

    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10);

    const formatted = await Promise.all(
      shuffled.map(async (item) => {
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(item.file_name);

        return {
          id: item.id,
          word: item.translate.toUpperCase(),
          image_url: urlData?.publicUrl || "",
          isCorrect: false,
        };
      })
    );

    setAllItems(formatted);
    setCurrentIndex(0);
    setError(null);
  }, [currentLanguage]);

  const startNewRound = useCallback(() => {
    const pool = allItems.slice();
    const correct = pool[currentIndex];
    const others = pool.filter((_, idx) => idx !== currentIndex).sort(() => Math.random() - 0.5).slice(0, 2);
    const options = [...others, correct].sort(() => Math.random() - 0.5).map((item) => ({
      ...item,
      isCorrect: item.id === correct.id,
    }));

    setRoundItems(options);
    setTargetWord(correct.word);
    setFeedback(null);
    setSuccess(false);
    setSelectedWrongId(null);
    setAnimationKey((k) => k + 1);
    setAttempts(0);
    setRevealAnswer(false);
  }, [allItems, currentIndex]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (allItems.length > 0) {
      startNewRound();
    }
  }, [allItems, currentIndex, startNewRound]);

  const handleChoice = (item: GameItem) => {
    playClickSound();
    setSelectedWrongId(null);

    if (item.isCorrect) {
      setFeedback("Bravo ! 🎉");
      setSuccess(true);
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1 < allItems.length ? i + 1 : 0));
      }, 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setFeedback("Oups ! Essaie encore...");
      setSelectedWrongId(item.id);

      if (newAttempts >= 3) {
        setRevealAnswer(true);
        setTimeout(() => {
          setFeedback(`C'était : ${targetWord}`);
          setTimeout(() => {
            setCurrentIndex((i) => (i + 1 < allItems.length ? i + 1 : 0));
          }, 1500);
        }, 1000);
      }
    }
  };

  return (
    <div translate="no" className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-pink">Jeu - Trouve l’image</h1>
          <button onClick={() => navigate(-1)} className="btn-secondary">Retour</button>
        </div>

        <div className="card mb-6 text-center">
          {error ? (
            <p className="text-red-600 text-lg">{error}</p>
          ) : targetWord && roundItems.length === 3 ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={animationKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-lg mb-4"><b>Où est :</b></p>
                <h2 className="text-3xl font-bold text-blue-700 mb-6">{targetWord}</h2>

                <div className="grid gap-6 md:grid-cols-3">
                  {roundItems.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.05 }}
                      className="cursor-pointer"
                      onClick={() => handleChoice(item)}
                      style={{ maxWidth: "200px", margin: "0 auto" }}
                    >
                      <div className={`relative max-w-[200px] mx-auto transition-all duration-300 ${
                        success && item.isCorrect
                          ? 'ring-green-500'
                          : selectedWrongId === item.id
                          ? 'ring-red-500'
                          : revealAnswer && item.isCorrect
                          ? 'ring-green-500'
                          : 'ring-pink'
                      } rounded-lg shadow-lg w-full ring-4 ring-offset-2`}>
                        <img
                          src={item.image_url}
                          alt={item.word}
                          className="rounded-lg w-full h-[180px] object-contain"
                        />
                        <div className="rounded-lg absolute bottom-0 left-0 w-full bg-pink bg-opacity-50 text-sm text-center py-1">
                          ?
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {feedback && (
                  <p className={`mt-6 text-lg font-semibold ${success ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-lg text-gray-600">Chargement du jeu…</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
