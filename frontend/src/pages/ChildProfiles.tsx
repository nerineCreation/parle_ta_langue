import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../store";
import { supabase } from "../lib/supabase";
import type { ChildProfile } from "../types";
import { playClickSound } from '../lib/sound'

export function ChildProfiles() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState<"0-3" | "4-6" | "7-11">("4-6");
  const [loading, setLoading] = useState(false);
  const children = useStore((state) => state.children);
  const setChildren = useStore((state) => state.setChildren);
  const user = useStore((state) => state.user);
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

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("child_profiles")
        .select("*")
        .eq("parent_id", user.id);
      if (error) {
        console.error("Erreur lors de la récupération des profils enfants:", error);
        return;
      }
      setChildren(data || []);
    };

    fetchChildren();
  }, [user, setChildren]);

  const handleAddChild = async () => {
    if (children.length >= 5) {
      alert("Vous ne pouvez pas créer plus de 5 profils enfants.");
      return;
    }

    setLoading(true);

    try {
      const newChild: ChildProfile = {
        id: crypto.randomUUID(),
        parent_id: user?.id || "",
        name,
        age_group: ageGroup,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("child_profiles")
        .insert([newChild])
        .select();

      if (error) throw error;

      setChildren([...children, ...data]);
      setName("");
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'enfant :", error);
      alert("Une erreur est survenue lors de la création du profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce profil ?")) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("child_profiles")
        .delete()
        .eq("id", childId);

      if (error) throw error;

      // Supprimer l'enregistrement correspondant dans game_progress pour cet enfant
      await supabase
        .from("game_progress")
        .delete()
        .eq("child_id", childId);
        
      // Recharger la liste des enfants après suppression
      const { data, error: fetchError } = await supabase
        .from("child_profiles")
        .select("*")
        .eq("parent_id", user!.id);
      if (fetchError) throw fetchError;

      setChildren(data || []);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enfant :", error);
      alert("Une erreur est survenue lors de la suppression du profil.");
    } finally {
      setLoading(false);
    }

    
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
        {bgmUrl && (<audio src={bgmUrl} autoPlay loop muted={!soundEnabled} className="hidden" />)}

{/*        <button
            onClick={toggle}
            className="text-xl p-2"
            aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
*/}
          <h1 className="text-4xl font-bold text-pink">Profils enfants</h1>
          <button onClick={() => {playClickSound(); navigate("/dashboard")}} className="btn-secondary">
            Retour
          </button>
        </div>

        <div className="grid gap-6">
          {children.length < 5 ? (
            <div className="card">
              <h2 className="text-2xl font-semibold mb-4">Ajouter un profil</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Prénom
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium mb-2">
                    Tranche d'âge
                  </label>
                  <select
                    id="age"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value as "0-3" | "4-6" | "7-11")}
                    className="input-field"
                    required
                    disabled={loading}
                  >
                    <option value="0-3">0-3 ans</option>
                    <option value="4-6">4-6 ans</option>
                    <option value="7-11">7-11 ans</option>
                  </select>
                </div>
                <button
                  onClick={() => {playClickSound(); handleAddChild()}}
                  className="btn-primary w-full"
                  disabled={loading || !name.trim()}
                >
                  {loading ? "Chargement..." : "Ajouter"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card bg-red-100 border border-red-400 text-red-700 p-4 rounded">
              <h2 className="text-2xl font-semibold mb-4">Limite atteinte</h2>
              <p className="text-sm">Vous ne pouvez pas ajouter plus de 5 profils enfants.</p>
            </div>
          )}

          {children.length > 0 && (
            <div className="card">
              <h2 className="text-2xl font-semibold mb-4">Profils existants</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-lg bg-pastel-pink"
                  >
                    <h3 className="font-semibold text-lg mb-2">{child.name}</h3>
                    <p className="text-sm mb-4">Âge : {child.age_group}</p>
                    <button
                      onClick={() => {playClickSound(); handleDeleteChild(child.id)}}
                      className="btn-secondary w-full bg-red-100 text-red-600 hover:bg-red-200"
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
