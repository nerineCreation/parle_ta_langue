/*
  # Optimisation des tables de langues

  1. Nouvelles politiques RLS
    - Ajout de politiques pour la mise à jour des langues activées
    - Ajout de politiques pour la suppression des langues activées

  2. Optimisations
    - Ajout d'index pour améliorer les performances des requêtes
    - Ajout de contraintes pour garantir l'intégrité des données

  3. Modifications
    - Ajout d'une colonne description pour les langues
*/

-- Ajout d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_parent_languages_parent_id ON parent_languages(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_languages_activation_code ON parent_languages(activation_code);
CREATE INDEX IF NOT EXISTS idx_languages_is_active ON languages(is_active);

-- Ajout de la colonne description
ALTER TABLE languages ADD COLUMN IF NOT EXISTS description text;

-- Politiques pour parent_languages
CREATE POLICY "Parents can update their language activations"
  ON parent_languages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their language activations"
  ON parent_languages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id);

-- Contraintes supplémentaires
ALTER TABLE parent_languages 
  ADD CONSTRAINT valid_activation_code 
  CHECK (activation_code ~ '^[A-Z0-9]{6}$');

-- Fonction pour générer un code d'activation unique
CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Générer un code aléatoire de 6 caractères
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS (
      SELECT 1 
      FROM parent_languages 
      WHERE activation_code = code
    ) INTO code_exists;
    
    -- Sortir de la boucle si le code est unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;