import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase connection.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  status: 'onboarding' | 'in_progress' | 'completed' | 'incomplete';
  final_score: number;
  final_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewSession {
  id: string;
  candidate_id: string;
  current_question: number;
  is_completed: boolean;
  session_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface QuestionAnswer {
  id: string;
  candidate_id: string;
  question_number: number;
  question_text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_limit: number;
  answer?: string;
  time_taken: number;
  ai_score: {
    technical: number;
    clarity: number;
    problem_solving: number;
    overall: number;
  };
  created_at: string;
}
