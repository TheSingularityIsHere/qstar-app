export interface QuestionData {
  question: string;
  answerA: string;
  identityA: string;
  biasA: number | undefined;
  answerB: string;
  identityB: string;
  biasB: number | undefined;
}

// Maps id to Date.now() to identify active users.
export type ActiveData = Record<string, number>;
// Key is "{id}-{questionId}", value is which answer is human.
export type VotesData = Record<string, 'A' | 'B'>

export type StateEnum = 'voting' | 'stats' | 'id';

export interface SurveyData {
  // Format: "{questionId}-{StateEnum}".
  // If questionId="" then it's at the end/beginning. Sequence:
  // -voting
  // 000-voting
  // 000-stats
  // 000-id
  // 001-voting
  // ...
  // -id
  state: string;
  questions: Record<string, QuestionData>;
  votes: VotesData;
  active: ActiveData;
}

export interface FirebaseData {
  survey: SurveyData;
}
