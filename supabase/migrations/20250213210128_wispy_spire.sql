/*
  # Création des tables pour le jeu de langue

  1. Nouvelles Tables
    - `languages`
      - `id` (uuid, primary key)
      - `code` (text, unique) - code de la langue (ex: fr, en, es)
      - `name` (text) - nom de la langue
      - `is_active` (boolean) - si la langue est disponible

    - `parent_languages`
      - `id` (uuid, primary key)
      - `parent_id` (uuid) - référence vers profiles
      - `language_id` (uuid) - référence vers languages
      - `activation_code` (text) - code d'activation de la langue
      - `activated_at` (timestamptz) - date d'activation

    - `themes`
      - `id` (uuid, primary key)
      - `name` (text) - nom du thème
      - `parent_theme_id` (uuid, nullable) - référence vers le thème parent
      - `order` (integer) - ordre d'affichage

    - `imagier`
      - `id` (uuid, primary key)
      - `theme_id` (uuid) - référence vers themes
      - `name` (text) - nom de l'image
      - `image_url` (text) - URL de l'image
      - `caps_word` (text) - mot en CAPS
      - `guib_word` (text) - mot en GUIB
      - `maur_word` (text) - mot en MAUR
      - `language_id` (uuid) - référence vers languages

    - `game_progress`
      - `id` (uuid, primary key)
      - `child_id` (uuid) - référence vers child_profiles
      - `theme_id` (uuid) - référence vers themes
      - `language_id` (uuid) - référence vers languages
      - `completed_items` (jsonb) - IDs des items complétés
      - `score` (integer) - score pour ce thème
      - `last_played_at` (timestamptz) - dernière session de jeu

    - `game_assets`
      - `id` (uuid, primary key)
      - `type` (text) - type d'asset (background, character, item, etc.)
      - `category` (text) - catégorie (menu, game, reward, etc.)
      - `url` (text) - URL de l'asset
      - `metadata` (jsonb) - métadonnées additionnelles

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour la lecture/écriture selon les rôles
*/

-- Table des langues
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table des langues activées par parent
CREATE TABLE IF NOT EXISTS parent_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) NOT NULL,
  language_id uuid REFERENCES languages(id) NOT NULL,
  activation_code text,
  activated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, language_id)
);

-- Table des thèmes
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_theme_id uuid REFERENCES themes(id),
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table de l'imagier
CREATE TABLE IF NOT EXISTS imagier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid REFERENCES themes(id) NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  caps_word text NOT NULL,
  guib_word text NOT NULL,
  maur_word text NOT NULL,
  language_id uuid REFERENCES languages(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table de progression du jeu
CREATE TABLE IF NOT EXISTS game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES child_profiles(id) NOT NULL,
  theme_id uuid REFERENCES themes(id) NOT NULL,
  language_id uuid REFERENCES languages(id) NOT NULL,
  completed_items jsonb DEFAULT '[]'::jsonb,
  score integer DEFAULT 0,
  last_played_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(child_id, theme_id, language_id)
);

-- Table des assets du jeu
CREATE TABLE IF NOT EXISTS game_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  category text NOT NULL,
  url text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('background', 'character', 'item', 'icon', 'sound')),
  CONSTRAINT valid_category CHECK (category IN ('menu', 'game', 'reward', 'tutorial'))
);

-- Enable Row Level Security
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagier ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;

-- Languages policies
CREATE POLICY "Anyone can read active languages"
  ON languages
  FOR SELECT
  USING (is_active = true);

-- Parent languages policies
CREATE POLICY "Parents can read their activated languages"
  ON parent_languages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can activate languages"
  ON parent_languages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = parent_id);

-- Themes policies
CREATE POLICY "Anyone can read themes"
  ON themes
  FOR SELECT
  TO authenticated
  USING (true);

-- Imagier policies
CREATE POLICY "Anyone can read imagier"
  ON imagier
  FOR SELECT
  TO authenticated
  USING (true);

-- Game progress policies
CREATE POLICY "Parents can read their children's progress"
  ON game_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE child_profiles.id = child_id
      AND child_profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update their children's progress"
  ON game_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE child_profiles.id = child_id
      AND child_profiles.parent_id = auth.uid()
    )
  );

-- Game assets policies
CREATE POLICY "Anyone can read game assets"
  ON game_assets
  FOR SELECT
  TO authenticated
  USING (true);