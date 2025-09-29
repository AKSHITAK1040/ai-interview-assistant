/*
  # Interview Assistant Schema

  1. New Tables
    - `candidates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `resume_url` (text)
      - `status` (text) - 'onboarding', 'in_progress', 'completed', 'incomplete'
      - `final_score` (integer)
      - `summary` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `interview_sessions`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key)
      - `current_question` (integer)
      - `is_completed` (boolean)
      - `session_data` (jsonb) - stores progress, timers, etc.
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `questions_and_answers`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key)
      - `question_number` (integer)
      - `question_text` (text)
      - `difficulty` (text) - 'Easy', 'Medium', 'Hard'
      - `time_limit` (integer)
      - `answer` (text)
      - `time_taken` (integer)
      - `ai_score` (jsonb) - technical, clarity, problem_solving scores
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  resume_url text,
  status text DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'in_progress', 'completed', 'incomplete')),
  final_score integer DEFAULT 0,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interview sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  current_question integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  session_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questions and answers table
CREATE TABLE IF NOT EXISTS questions_and_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  time_limit integer NOT NULL,
  answer text,
  time_taken integer DEFAULT 0,
  ai_score jsonb DEFAULT '{"technical": 0, "clarity": 0, "problem_solving": 0, "overall": 0}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions_and_answers ENABLE ROW LEVEL SECURITY;

-- Policies (allowing public access for now, can be restricted later)
CREATE POLICY "Allow all operations on candidates"
  ON candidates
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on interview_sessions"
  ON interview_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on questions_and_answers"
  ON questions_and_answers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS candidates_status_idx ON candidates(status);
CREATE INDEX IF NOT EXISTS candidates_final_score_idx ON candidates(final_score DESC);
CREATE INDEX IF NOT EXISTS candidates_created_at_idx ON candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS interview_sessions_candidate_id_idx ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS questions_answers_candidate_id_idx ON questions_and_answers(candidate_id);