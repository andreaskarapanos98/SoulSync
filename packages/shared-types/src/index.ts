// Shared DTOs between client and server.
// Add real DTOs here as we build each feature (e.g. PublicProfileDTO, CompatibilityBreakdownDTO).

export interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
}

export interface MeDTO {
  userId: string;
  email: string;
  onboardingStatus: "not_started" | "about_me" | "preferences" | "profile" | "complete";
  coinBalance: number;
}

export type QuestionType = "single_select" | "multi_select" | "scale" | "number" | "text" | "date";

export interface QuestionOptionDTO {
  value: string;
  label: string;
}

export interface QuestionDTO {
  key: string;
  category: string;
  type: QuestionType;
  label: string;
  options?: QuestionOptionDTO[];
  min?: number;
  max?: number;
  required: boolean;
  order: number;
  // Preference-only: whether the UI should ask for a target value in addition to
  // importance (e.g. height is importance-only — no target value is asked).
  valueCaptured?: boolean;
  // Preference-only: whether this dimension can be flagged as an absolute deal breaker.
  canBeDealBreaker?: boolean;
}

export type AnswerValue = string | number | string[];

export interface AboutMeAnswersDTO {
  answers: Record<string, AnswerValue>;
  missingRequired: string[];
}

export interface SaveAnswersResponseDTO {
  saved: true;
  missingRequired: string[];
}

export type ImportanceLevel =
  | "doesnt_matter"
  | "slight_preference"
  | "important"
  | "very_important"
  | "must_have";

export interface PreferenceAnswerValue {
  value?: AnswerValue;
  importance: ImportanceLevel;
}

export interface PreferenceAnswersDTO {
  answers: Record<string, PreferenceAnswerValue>;
  missingRequired: string[];
}

export interface DealBreakersDTO {
  dealBreakers: Record<string, string[]>;
}
