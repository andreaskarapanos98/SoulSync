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
