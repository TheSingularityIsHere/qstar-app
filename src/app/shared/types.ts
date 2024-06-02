export interface QuestionData {
  question: string;
  answerA: string;
  identityA: string;
  answerB: string;
  identityB: string;
}

// Maps id to Date.now().
export type ActiveData = Record<string, number>;
// Key is "{id}-{questionId}", value is which answer is human.
export type VotesData = Record<string, 'A' | 'B'>

export type StateEnum = 'voting' | 'stats' | 'id';

export interface SurveyData {
  // format: "{questionId}-{StateEnum}" where state is 'voting' | 'stats'
  state: string;
  questions: Record<string, QuestionData>;
  votes: VotesData;
  active: ActiveData;
}

export interface FirebaseData {
  survey: SurveyData;
}
