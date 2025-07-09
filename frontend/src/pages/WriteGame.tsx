import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'
import { playClickSound } from '../lib/sound'

interface WordData {
  id: string
  translate: string
  image_url: string
}

export function WriteGame() {
  const navigate = useNavigate()
  const currentLanguage = useStore((state) => state.currentLanguage)
  const themeId = useStore((state) => state.theme)
  const [words, setWords] = useState<WordData[]>([])
  const [currentWord, setCurrentWord] = useState<WordData | null>(null)
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([])
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [triesLeft, setTriesLeft] = useState(4)
  const [showResult, setShowResult] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [success, setSuccess] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchWords = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('id, translate, file_name')
        .eq('language_id', currentLanguage?.id)
        .eq('theme_id', themeId);

      if (error || !data || data.length === 0) {
        console.error('Erreur ou aucun mot trouvé :', error)
        setError('Aucun mot trouvé pour ce thème et cette langue.')
        return
      }

      const formatted = data.map((item) => {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(item.file_name)

        return {
          id: item.id,
          translate: item.translate.toUpperCase(),
          image_url: urlData?.publicUrl || ''
        }
      })

      setWords(formatted)
      pickRandomWord(formatted) // ✅ UN SEUL appel ici
    }

    if (themeId && currentLanguage) {
      fetchWords()
    }
  }, [themeId, currentLanguage])

  const pickRandomWord = (wordList = words) => {
    if (wordList.length === 0) return;

    const filtered = currentWord
      ? wordList.filter((w) => w.id !== currentWord.id)
      : wordList;

    // Si on a filtré tous les mots, on remet tous les mots disponibles
    const selectionPool = filtered.length > 0 ? filtered : wordList;

    const random = selectionPool[Math.floor(Math.random() * selectionPool.length)];

    setCurrentWord(random);
    const letters = random.translate.split('');
    setShuffledLetters([...letters].sort(() => Math.random() - 0.5));
    setSelectedLetters([]);
    setTriesLeft(4);
    setShowResult(false);
    setSuccess(false);
    setAnimationKey(prev => prev + 1);
  }

  const handleLetterClick = (letter: string, index: number) => {
    playClickSound()
    setFeedbackMessage(null) // ← Efface le message dès qu’on clique
    const updated = [...shuffledLetters]
    updated.splice(index, 1)
    setShuffledLetters(updated)
    setSelectedLetters((prev) => [...prev, letter])
  }

  const resetGame = () => {
    if (!currentWord) return
    const letters = currentWord.translate.split('')
    setShuffledLetters([...letters].sort(() => Math.random() - 0.5))
    setSelectedLetters([])
    setTriesLeft(4)
    setShowResult(false)
    setSuccess(false)
  }

  const handleValidate = () => {
    const wordFormed = selectedLetters.join('')
    if (wordFormed === currentWord?.translate) {
      setSuccess(true)
      setShowResult(true)
      setFeedbackMessage(null)
      setTimeout(() => {
        pickRandomWord()
      }, 2000)
    } else {
      const remaining = triesLeft - 1
      setFeedbackMessage('Oups, ce n’est pas le bon mot. Essaie encore !')
      resetGame();
      setTriesLeft(remaining)

      if (remaining === 0) {
        setShowResult(true)
        setTimeout(() => {
          setFeedbackMessage(null)
          pickRandomWord()
        }, 3000)
      }
    }
  }

  return (
    <div translate="no" className="min-h-screen bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold text-pink">Jeu d’écriture</h1>
            <p className="text-sm text-gray-500">Essais restants : {triesLeft}</p>
          </div>
          <button onClick={() => { playClickSound(); navigate(-1) }} className="btn-secondary">
            Retour
          </button>
        </div>

        <div className="card mb-6 text-center">
          {error ? (
            <p className="text-lg text-red-600">{error}</p>
          ) : currentWord ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={animationKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-lg mb-4"><b>Recompose le mot à partir des lettres mélangées !</b></p>

                <div className="flex justify-center mb-4">
                  {feedbackMessage && (
                    <p className="text-red-600 mt-4 text-base font-medium">{feedbackMessage}</p>
                  )}
                </div>

                <div className="flex justify-center mb-4">
                  <img
                    src={currentWord.image_url}
                    /*alt={/*currentWord.translate}*/
                    className={`rounded-lg shadow-lg w-48 h-48 object-contain ring-4 ${success ? 'ring-green-500' : 'ring-pink'} ring-offset-2`}
                  />
                </div>

                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Mot en cours :</h2>
                  <div className="flex justify-center flex-wrap gap-2">
                    {selectedLetters.map((letter, idx) => (
                      <span key={idx} className="bg-green-200 text-black rounded px-3 py-1 text-xl">
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Lettres disponibles :</h2>
                  <div className="flex justify-center flex-wrap gap-3">
                    {shuffledLetters.map((letter, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLetterClick(letter, idx)}
                        className="bg-yellow-100 text-black rounded px-4 py-2 text-xl hover:bg-yellow-200"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>

                {showResult && !success && (
                  <p className="text-red-500 mt-4 text-lg font-semibold">
                    Le mot était : <span className="underline">{currentWord.translate}</span>
                  </p>
                )}

                <div className="flex justify-center gap-4 mt-6">
                  <button onClick={handleValidate} className="btn-primary">Valider</button>
                  <button onClick={resetGame} className="btn-secondary">Réinitialiser</button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-lg text-gray-600">Chargement du mot...</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
