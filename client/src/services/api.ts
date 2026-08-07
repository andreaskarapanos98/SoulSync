import type {
  AboutMeAnswersDTO,
  AnswerValue,
  MeDTO,
  QuestionDTO,
  SaveAnswersResponseDTO,
} from "@soulsync/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  issues?: string[];

  constructor(status: number, issues?: string[]) {
    super(`API request failed with status ${status}`);
    this.status = status;
    this.issues = issues;
  }
}

type GetToken = () => Promise<string | null>;

export function createApiClient(getToken: GetToken) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.issues);
    }
    return res.json() as Promise<T>;
  }

  return {
    getMe: () => request<MeDTO>("/api/v1/me"),
    getAboutMeQuestions: () =>
      request<{ questions: QuestionDTO[] }>("/api/v1/questions?appliesTo=about_me"),
    getAboutMeAnswers: () => request<AboutMeAnswersDTO>("/api/v1/me/about-me"),
    saveAboutMeAnswers: (answers: Record<string, AnswerValue>) =>
      request<SaveAnswersResponseDTO>("/api/v1/me/about-me", {
        method: "PUT",
        body: JSON.stringify({ answers }),
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
