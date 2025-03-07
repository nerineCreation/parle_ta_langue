import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuthSession() {
  const [session, setSession] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    // Récupérer la session initiale
    async function getSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      }
      setSession(data.session);
      setAuthLoaded(true);
    }
    getSession();

    // Écouter les changements d'état d'authentification
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, authLoaded };
}
