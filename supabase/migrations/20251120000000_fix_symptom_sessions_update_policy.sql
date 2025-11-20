-- Add missing UPDATE policy for symptom_sessions table
CREATE POLICY "Users can update own sessions"
  ON public.symptom_sessions FOR UPDATE
  USING (auth.uid() = user_id);
