/*
  # Create profiles and child profiles tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text)
      - `created_at` (timestamp)
    - `child_profiles`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, foreign key to profiles.id)
      - `name` (text)
      - `age_group` (text)
      - `avatar` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read and update their own profile
      - Read, create, update their own children's profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create child_profiles table
CREATE TABLE IF NOT EXISTS child_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  age_group text NOT NULL,
  avatar text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_age_group CHECK (age_group IN ('0-3', '4-6', '7-11'))
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Child profiles policies
CREATE POLICY "Users can read own children"
  ON child_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can create profiles for own children"
  ON child_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update own children profiles"
  ON child_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id);