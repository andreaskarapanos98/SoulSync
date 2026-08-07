import type {
  AboutMeAnswersDTO,
  AnswerValue,
  DealBreakersDTO,
  MeDTO,
  OwnProfileDTO,
  PhotosResponseDTO,
  PreferenceAnswerValue,
  PreferenceAnswersDTO,
  ProfileDTO,
  QuestionDTO,
  SaveAnswersResponseDTO,
  VoiceIntroResponseDTO,
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
      throw new ApiError(res.status, body.issues ?? (body.error ? [body.error] : undefined));
    }
    return res.json() as Promise<T>;
  }

  async function requestMultipart<T>(path: string, method: string, formData: FormData): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.issues ?? (body.error ? [body.error] : undefined));
    }
    return res.json() as Promise<T>;
  }

  return {
    getMe: () => request<MeDTO>("/api/v1/me"),
    getQuestions: (appliesTo: "about_me" | "preference") =>
      request<{ questions: QuestionDTO[] }>(`/api/v1/questions?appliesTo=${appliesTo}`),
    getAboutMeAnswers: () => request<AboutMeAnswersDTO>("/api/v1/me/about-me"),
    saveAboutMeAnswers: (answers: Record<string, AnswerValue>) =>
      request<SaveAnswersResponseDTO>("/api/v1/me/about-me", {
        method: "PUT",
        body: JSON.stringify({ answers }),
      }),
    getPreferenceAnswers: () => request<PreferenceAnswersDTO>("/api/v1/me/preferences"),
    savePreferenceAnswers: (answers: Record<string, PreferenceAnswerValue>) =>
      request<SaveAnswersResponseDTO>("/api/v1/me/preferences", {
        method: "PUT",
        body: JSON.stringify({ answers }),
      }),
    getDealBreakers: () => request<DealBreakersDTO>("/api/v1/me/deal-breakers"),
    saveDealBreakers: (dealBreakers: Record<string, string[]>) =>
      request<{ saved: true }>("/api/v1/me/deal-breakers", {
        method: "PUT",
        body: JSON.stringify({ dealBreakers }),
      }),
    getProfile: () => request<OwnProfileDTO>("/api/v1/me/profile"),
    getPublicProfile: (clerkId: string) => request<ProfileDTO>(`/api/v1/profiles/${clerkId}`),
    saveBio: (bio: string) =>
      request<SaveAnswersResponseDTO>("/api/v1/me/profile", {
        method: "PUT",
        body: JSON.stringify({ bio }),
      }),
    uploadPhoto: (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return requestMultipart<PhotosResponseDTO>("/api/v1/me/profile/photos", "POST", formData);
    },
    deletePhoto: (photoId: string) =>
      request<PhotosResponseDTO>(`/api/v1/me/profile/photos/${photoId}`, { method: "DELETE" }),
    setPrimaryPhoto: (photoId: string) =>
      request<PhotosResponseDTO>(`/api/v1/me/profile/photos/${photoId}/primary`, { method: "PATCH" }),
    setPhotoFocalPoint: (photoId: string, x: number, y: number) =>
      request<{ photos: PhotosResponseDTO["photos"] }>(`/api/v1/me/profile/photos/${photoId}/focal-point`, {
        method: "PATCH",
        body: JSON.stringify({ x, y }),
      }),
    uploadVoiceIntro: (blob: Blob, durationSec: number) => {
      const formData = new FormData();
      formData.append("audio", blob, "voice-intro.webm");
      formData.append("durationSec", String(durationSec));
      return requestMultipart<VoiceIntroResponseDTO>("/api/v1/me/profile/voice-intro", "POST", formData);
    },
    deleteVoiceIntro: () =>
      request<VoiceIntroResponseDTO>("/api/v1/me/profile/voice-intro", { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
