/*
  # Add delete policy for child profiles

  1. Security Changes
    - Add policy to allow users to delete their children's profiles
*/

CREATE POLICY "Users can delete own children profiles"
  ON child_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id);