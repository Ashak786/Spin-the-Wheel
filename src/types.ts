export interface Question {
  id: number | string;
  category: string;
  question_text: string;
  answer?: string;
  options?: string[]; // Optional helper for multiple options
  source?: 'supabase' | 'default';
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  statusMessage: string;
}

export interface GameStats {
  score: number;
  streak: number;
  correctAnswers: number;
  totalSpins: number;
  answeredQuestions: {
    questionId: number | string;
    category: string;
    isCorrect: boolean;
    timestamp: number;
  }[];
}
