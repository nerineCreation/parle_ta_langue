// --- Code React de la page Lecture ---

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { playClickSound } from '../lib/sound';

interface SentenceData {
  id: string;
  sentence: string;
  word: string;
  image_url: string;
  audio_name: string;
}

export function Read() {
  const navigate = useNavigate();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const [data, setData] = useState<SentenceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentence = async () => {
      if (!currentLanguage) {
        setError('Langue non définie.');
        return;
      }

      const { data, error } = await supabase
        .from('sentences')
        .select('id, sentence, word, image_file, audio_name')
        .eq('language_id', currentLanguage.id)
        .order('id')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setError('Aucune donnée trouvée.');
        return;
      }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.image_file);
      setData({
        id: data.id,
        sentence: data.sentence,
        word: data.word,
        image_url: urlData?.publicUrl || '',
        audio_name: data.audio_name,
      });
    };

    fetchSentence();
  }, [currentLanguage]);

  const playSentenceAudio = async () => {
    if (!data?.audio_name) return;
    const { data: audioData } = supabase.storage.from('audios').getPublicUrl(data.audio_name);
    const audio = new Audio(audioData?.publicUrl);
    audio.play();
  };

  const highlightWordInSentence = (sentence: string, word: string) => {
    const regex = new RegExp(`(${word})`, 'gi');
    return sentence.split(regex).map((part, idx) => (
      part.toLowerCase() === word.toLowerCase() ? (
        <span key={idx} className="text-pink font-bold">{part}</span>
      ) : (
        <span key={idx}>{part}</span>
      )
    ));
  };

  return (
    <div translate="no" className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pink">Lecture</h1>
          <button onClick={() => navigate(-1)} className="btn-secondary">Retour</button>
        </div>

        <div className="card p-4 text-center">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : data ? (
            <>
              <img src={data.image_url} alt={data.word} className="w-48 h-48 mx-auto object-contain mb-4" />
              <p className="text-xl mb-2">Phrase :</p>
              <p className="text-2xl mb-4">{highlightWordInSentence(data.sentence, data.word)}</p>
              <button onClick={() => { playClickSound(); playSentenceAudio(); }} className="btn-primary">Écouter</button>
            </>
          ) : (
            <p className="text-gray-600">Chargement...</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
