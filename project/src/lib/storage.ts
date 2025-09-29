// Local storage utilities for session persistence
export const STORAGE_KEYS = {
  CURRENT_CANDIDATE: 'interview_current_candidate',
  SESSION_STATE: 'interview_session_state',
  ANSWERS: 'interview_answers'
};

export interface SessionState {
  candidateId: string;
  currentQuestion: number;
  questions: Array<{
    question: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeLimit: number;
  }>;
  startTime: number;
  isCompleted: boolean;
  answers: Record<number, {
    answer: string;
    timeTaken: number;
    score?: any;
  }>;
}

export const saveSessionState = (state: SessionState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving session state:', error);
  }
};

export const getSessionState = (): SessionState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading session state:', error);
    return null;
  }
};

export const clearSessionState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_STATE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CANDIDATE);
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
  } catch (error) {
    console.error('Error clearing session state:', error);
  }
};

export const saveCurrentCandidate = (candidate: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CANDIDATE, JSON.stringify(candidate));
  } catch (error) {
    console.error('Error saving current candidate:', error);
  }
};

export const getCurrentCandidate = (): any => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_CANDIDATE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading current candidate:', error);
    return null;
  }
};