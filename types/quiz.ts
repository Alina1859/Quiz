export interface Question {
  id: number;
  text: string;
  options: string[];
}

export interface UserAnswer {
  [questionId: number]: string;
}

export interface QuizState {
  questions: Question[];
  selectedAnswers: UserAnswer;
  error: string | null;
}

export interface QuizResultData {
  answers: UserAnswer;
  phone: string;
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface SessionData {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'completed';
}
