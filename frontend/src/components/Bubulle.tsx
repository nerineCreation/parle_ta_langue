import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface BubulleProps {
  age?: '0-3' | '4-6' | '7-11';
  className?: string;
}

export default function Bubulle({ age = '', className = '' }: BubulleProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [bubulleImage, setBubulleImage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBubulleImage = async () => {
      try {
        // Définition du nom du fichier selon la tranche d'âge
        var fileName;

        if (age == ''){
          fileName = 'Bubulle.png';
        }
        else {
          fileName = `Bubulle_${age}.png`;
        }

        // Vérification de l'existence du fichier dans le stockage Supabase
        const { data, error } = supabase.storage.from('images').getPublicUrl(fileName);

        if (error || !data.publicUrl) {
          console.error(`Erreur lors du chargement de l'image ${fileName}:`, error);
          setError(true);
          return;
        }

        setBubulleImage(data.publicUrl);
      } catch (err) {
        console.error('Erreur inattendue lors du chargement de Bubulle:', err);
        setError(true);
      }
    };

    fetchBubulleImage();
  }, [age]);

  return (
    <motion.div
      className={`flex justify-center ${className}`}
      animate={{
        y: isAnimating ? -10 : 0,
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {bubulleImage && !error ? (
        <img
          src={bubulleImage}
          alt={`Bubulle ${age}`}
          className="w-24 h-24 object-contain"
        />
      ) : (
        <p className="text-sm text-gray-500">Image non trouvée</p>
      )}
    </motion.div>
  );
}
