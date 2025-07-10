import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { playClickSound } from '../lib/sound';

interface MediaItem {
  id: string;
  title: string;
  description: string;
  image_file: string;
  video_url: string;
}

export function Media() {
  const navigate = useNavigate();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!currentLanguage?.id) return;

      const { data, error } = await supabase
        .from('media')
        .select('id, title, description, image_file, video_url')
        .eq('language_id', currentLanguage.id)
        .order('title');

      if (error) {
        console.error('Erreur lors du chargement des médias :', error);
        setError('Erreur lors du chargement des médias.');
        setLoading(false);
        return;
      }

      const enriched = data.map((item) => {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(item.image_file);
        return {
          ...item,
          image_file: urlData?.publicUrl || '',
        };
      });

      setMediaList(enriched);
      setLoading(false);
    };

    fetchMedia();
  }, [currentLanguage]);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-pink">Photo / Vidéo</h1>
          <button onClick={() => navigate(-1)} className="btn-secondary">Retour</button>
        </div>

        {loading ? (
          <p className="text-lg text-gray-600">Chargement...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {mediaList.map((item) => (
              <div key={item.id} className="card shadow-lg">
                <img
                  src={item.image_file}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-blue-700">{item.title}</h2>
                  <p className="text-gray-700 mb-2">{item.description}</p>
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    onClick={playClickSound}
                  >
                    Regarder la vidéo
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}