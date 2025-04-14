import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function Rewards() {
  const navigate = useNavigate();
  const gameProgress = useStore((state) => state.gameProgress);

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold text-pink mb-4">Récompenses</h1>
            <p className="text-lg mb-4">
            Vous avez accumulé {gameProgress?.score ?? 0} pièces d'or !
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Retour
          </button>
        </div>
      </motion.div>
    </div>
  );
}
