import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { supabase } from "../lib/supabase";
import Confetti from "react-confetti";

export function ImagierGame() {
  const navigate = useNavigate();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const currentChild = useStore((state) => state.currentChild);
  const themeId = useStore((state) => state.theme);
  const gameProgress = useStore((state) => state.gameProgress);
  const [images, setImages] = useState(
    [] as { id: string; url: string; word: string; fileName: string }[]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [animateImage, setAnimateImage] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // Variantes d'animation pour les boutons
  const buttonVariants = {
    initial: {},
    correct: { scale: [1, 1.3, 1], transition: { duration: 0.5 } },
    wrong: { x: [0, -20, 20, -20, 20, 0], transition: { duration: 0.5 } },
  };

  // Variante pour l'animation de la pièce d'or : la pièce s'agrandit et devient plus brillante
  const coinVariants = {
    initial: { scale: 0, opacity: 0, filter: "brightness(100%)" },
    animate: { scale: 3, opacity: 1, filter: "brightness(200%)", transition: { duration: 0.6 } },
    exit: { scale: 0, opacity: 0, filter: "brightness(100%)", transition: { duration: 0.6 } },
  };

  // Variantes pour l'animation de l'image : "static" (pas d'animation) et "pulse" (grossir puis rapetisser)
  const imageVariants = {
    static: { scale: 1, opacity: 1 },
    pulse: { scale: [1, 1.2, 1], opacity: 1, transition: { duration: 1 } },
  };

  // Fonction pour obtenir un index aléatoire parmi les images
  const getRandomIndex = () => Math.floor(Math.random() * images.length);

  // Récupération de la progression de l'enfant depuis la table "game_progress"
  useEffect(() => {
    if (!currentChild) {
      navigate('/profiles');
      return;
    }
    if (!currentLanguage) {
      navigate('/dashboard');
      return;
    }

    const fetchGameProgress = async () => {
      if (currentChild && currentLanguage && themeId) {
        const { data, error } = await supabase
          .from("game_progress")
          .select("*")
          .eq("child_id", currentChild.id)
          .eq("language_id", currentLanguage)
          .maybeSingle();
        if (error) {
          console.error("Erreur lors de la récupération de la progression :", error);
        } else {
          useStore.getState().setGameProgress(data);
        }
      }
    };

    fetchGameProgress();
  }, [currentChild, currentLanguage, themeId]);

  // Chargement des images depuis la table "imagier"
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);

      if (!currentLanguage || !themeId) {
        console.warn("Langue ou thème non défini. Impossible de récupérer les images.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("imagier")
        .select("id, file_name, translate")
        .eq("language_id", currentLanguage)
        .eq("theme_id", themeId)
        .limit(8);

      if (error) {
        console.error("Erreur lors de la récupération des images :", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("Aucune image trouvée pour ce thème et cette langue.");
        setImages([]);
        setLoading(false);
        return;
      }

      const formattedImages = data.map((img) => {
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(img.file_name);
        return {
          id: img.id,
          url: urlData.publicUrl || "",
          word: img.translate.toUpperCase(),
          fileName: img.file_name,
        };
      });

      setImages(formattedImages);
      setCurrentIndex(Math.floor(Math.random() * formattedImages.length));
      setLoading(false);
    };

    fetchImages();
  }, [currentLanguage, themeId]);

  // Génération des options de réponse
  useEffect(() => {
    if (images.length > 0) {
      const correctWord = images[currentIndex]?.word;
      const wrongWords = images
        .filter((img) => img.word !== correctWord)
        .map((img) => img.word)
        .sort(() => 0.5 - Math.random());

      const generatedOptions = [correctWord, ...wrongWords.slice(0, 3)].sort(
        () => 0.5 - Math.random()
      );
      setOptions(generatedOptions);
    }
  }, [images, currentIndex]);

  const handleWordSelection = (word: string) => {
    if (word === images[currentIndex].word) {
      // Réponse correcte
      setIsCorrect(true);
      setShowConfetti(true);
  
      // Calcul du nouveau score
      const newCoins = (gameProgress?.score || 0) + 1;
      useStore.getState().setGameProgress({ score: newCoins });
      
      if (currentChild) {
        // Utilisation de upsert pour mettre à jour ou insérer la ligne
        supabase
          .from("game_progress")
          .upsert(
            {
              child_id: currentChild.id,
              theme_id: themeId,
              language_id: currentLanguage,
              score: newCoins,
              last_played_at: new Date().toISOString(),
            },
            { onConflict: ["child_id", "theme_id", "language_id"] }
          )
          .then(({ error }) => {
            if (error) {
              console.error("Erreur lors de la mise à jour du score :", error);
            }
          });
      }
  
      // Séquence d'animation :
      // 1. Afficher les confettis pendant 1 seconde
      setTimeout(() => {
        setShowConfetti(false);
        // 2. Afficher la pièce d'or et animer l'image (pulse)
        setShowCoinAnimation(true);
        setAnimateImage(true);
        // 3. Après 1,5 seconde, arrêter l'animation et passer à l'image suivante
        setTimeout(() => {
          setShowCoinAnimation(false);
          setAnimateImage(false);
          setCurrentIndex(getRandomIndex());
          setAttempts(0);
          setIsCorrect(null);
          setSelectedWord(null);
        }, 1500);
      }, 1000);
    } else {
      // Réponse fausse
      if (attempts + 1 >= 3) {
        setShowCorrectAnswer(true);
        setTimeout(() => {
          setShowCorrectAnswer(false);
          setCurrentIndex(getRandomIndex());
          setAttempts(0);
          setIsCorrect(null);
          setSelectedWord(null);
        }, 3000);
      } else {
        setSelectedWord(word);
        setIsCorrect(false);
        setAttempts((prev) => prev + 1);
        setTimeout(() => {
          setIsCorrect(null);
          setSelectedWord(null);
        }, 4000);
      }
    }
  };  

  return (
    <div className="min-h-screen bg-background p-8">
      {showConfetti && (
        <Confetti
          numberOfPieces={400}
          recycle={false}
          confettiSource={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            w: 0,
            h: 0,
          }}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center">
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold text-pink">
              Trouve le mot correspondant à l'image
            </h1>
            <button onClick={() => navigate('/rewards')} className="text-lg btn-secondary">
              Pièces d'or : {gameProgress?.score ?? 0}
            </button>
          </div>
          <button onClick={() => navigate('/imagier')} className="btn-secondary">
            Retour
          </button>
        </div>
        {loading ? (
          <p className="text-lg text-gray-600">Chargement des images...</p>
        ) : images.length === 0 ? (
          <p className="text-lg text-gray-600">
            Aucune image trouvée pour le thème : {themeId}
          </p>
        ) : (
          <>
            <motion.div
              key={images[currentIndex]?.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={animateImage ? "pulse" : "static"}
              variants={imageVariants}
              transition={{ duration: 0.5 }}
              className="relative mb-6 mx-auto"
              style={{ maxWidth: "400px" }}
            >
              <img
                src={images[currentIndex]?.url}
                alt={images[currentIndex]?.fileName}
                className="rounded-lg shadow-lg block max-w-full h-auto"
              />
              <AnimatePresence>
                {showCoinAnimation && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={coinVariants}
                    className="absolute inset-0 flex justify-center items-center pointer-events-none"
                  >
                    <span className="text-xl">🪙</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {options.map((word, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleWordSelection(word)}
                  variants={buttonVariants}
                  animate={
                    showCorrectAnswer && word === images[currentIndex]?.word
                      ? "correct"
                      : isCorrect === true && word === images[currentIndex]?.word
                      ? "correct"
                      : isCorrect === false && selectedWord === word
                      ? "wrong"
                      : "initial"
                  }
                  className={`p-4 font-bold uppercase rounded-lg shadow-md transition-all duration-200 text-black ${
                    showCorrectAnswer && word === images[currentIndex]?.word
                      ? "bg-blue-500"
                      : isCorrect === false && selectedWord === word
                      ? "bg-rose-600"
                      : isCorrect === true && word === images[currentIndex]?.word
                      ? "bg-rose-400"
                      : "bg-rose-200 hover:bg-rose-300"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  disabled={isCorrect !== null && !showCorrectAnswer}
                >
                  {word}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
