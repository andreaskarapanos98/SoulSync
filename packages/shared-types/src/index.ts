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

// number_range: two linked numbers within [min, max] (e.g. age range 16-60, where 60
// means "60+"). Stored as a 2-element [low, high] tuple.
export type QuestionType = "single_select" | "multi_select" | "scale" | "number" | "number_range" | "text" | "date";

// Preference-only: how this question feeds the (future) compatibility algorithm.
// hard_filter = mismatch means 0% and stop scoring entirely (gender, age range).
// ranking = viewer ranks all options, partial credit by rank position (e.g. hair color).
// mini_scale = options/scale have a natural order, viewer picks one target point, scored
//   by distance (e.g. smoking: never->socially->regularly).
// relative_self = compares candidate's value to the VIEWER's own about_me answer, not an
//   independent target (e.g. height: "taller than me").
// checklist = multi-select, any accepted value matching earns credit, no ranking.
// filler = captured and shown, never contributes to the score (e.g. "how important is
//   honesty to you" — not objectively verifiable).
export type ScoringMechanic = "hard_filter" | "ranking" | "mini_scale" | "relative_self" | "checklist" | "filler";

export interface QuestionOptionDTO {
  value: string;
  label: string;
  // multi_select only: checking this option clears every other selection, and vice versa.
  exclusive?: boolean;
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
  // single_select only: render as a searchable combobox instead of a plain dropdown.
  searchable?: boolean;
  // Preference-only.
  scoringMechanic?: ScoringMechanic;
  // Preference-only: whether this dimension can ALSO be flagged as a personal deal breaker.
  canBeDealBreaker?: boolean;
}

export type AnswerValue = string | number | string[] | number[];

export interface AboutMeAnswersDTO {
  answers: Record<string, AnswerValue>;
  missingRequired: string[];
}

export interface SaveAnswersResponseDTO {
  saved: true;
  missingRequired: string[];
}

// Same shape as AboutMeAnswersDTO — preferences no longer carry a separate importance
// weight. For "ranking" mechanic questions, the value is the full ordered list of option
// values (best to worst); an empty array means "I don't care".
export interface PreferenceAnswersDTO {
  answers: Record<string, AnswerValue>;
  missingRequired: string[];
}

export interface DealBreakersDTO {
  dealBreakers: Record<string, string[]>;
}

export interface PhotoDTO {
  id: string;
  url: string;
  isPrimary: boolean;
  // Where the circular avatar crop centers on this photo, as percentages (0-100).
  focalPoint: { x: number; y: number };
}

export interface VoiceIntroDTO {
  url: string;
  durationSec: number;
}

export interface ProfileTraitDTO {
  key: string;
  category: string;
  label: string;
  value: AnswerValue;
}

export interface CategoryCompatibilityDTO {
  category: string;
  percent: number;
}

export interface ProfileDTO {
  firstName: string;
  age?: number;
  nationality?: string;
  country?: string;
  city?: string;
  occupation?: string;
  education?: string;
  languages?: string[];
  bio: string;
  photos: PhotoDTO[];
  voiceIntro: VoiceIntroDTO | null;
  traits: ProfileTraitDTO[];
  // Absent when viewing your own profile (comparing yourself to yourself isn't a score).
  compatibilityByCategory?: CategoryCompatibilityDTO[];
}

export interface OwnProfileDTO extends ProfileDTO {
  missingRequired: string[];
}

export interface PhotosResponseDTO {
  photos: PhotoDTO[];
  missingRequired: string[];
}

export interface VoiceIntroResponseDTO {
  voiceIntro: VoiceIntroDTO | null;
  missingRequired?: string[];
}

export interface MatchCardDTO {
  clerkId: string;
  firstName: string;
  age?: number;
  city?: string;
  country?: string;
  photoUrl?: string;
  hasVoiceIntro: boolean;
  voiceIntroUrl?: string;
  // 0-100, real weighted compatibility score (see compatibilityScoring.ts).
  compatibility: number;
  // Whether the viewer has unlocked this candidate (no payment gate yet — free for now).
  unlocked: boolean;
}

export interface MatchesResponseDTO {
  // Candidates who fit what the viewer is looking for.
  yourSoulmates: MatchCardDTO[];
  // Candidates the viewer fits what THEY are looking for.
  theirSoulmate: MatchCardDTO[];
}

export interface ConversationSummaryDTO {
  clerkId: string;
  firstName: string;
  photoUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  compatibility: number;
  unread: boolean;
}

export interface ConversationsResponseDTO {
  conversations: ConversationSummaryDTO[];
}

export interface UnreadCountDTO {
  count: number;
  latestUnreadMessageAt?: string;
}

export interface MessageDTO {
  id: string;
  fromClerkId: string;
  toClerkId: string;
  body: string;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  durationSec?: number;
  createdAt: string;
  readAt?: string;
  editedAt?: string;
  deleted?: boolean;
}

export interface MessagesResponseDTO {
  messages: MessageDTO[];
  otherFirstName: string;
  otherPhotoUrl?: string;
  otherIsTyping: boolean;
}

export interface SendMessageResponseDTO {
  message: MessageDTO;
}
