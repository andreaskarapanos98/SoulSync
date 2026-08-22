import type {
  AboutMeAnswersDTO,
  AnswerValue,
  BlockedClerkIdsResponseDTO,
  CoinPackagesResponseDTO,
  ConversationsResponseDTO,
  CreateCheckoutSessionResponseDTO,
  CreateReportRequestDTO,
  DealBreakersDTO,
  GiftCatalogResponseDTO,
  MatchesResponseDTO,
  MeDTO,
  MessagesResponseDTO,
  NotificationsResponseDTO,
  OwnProfileDTO,
  PhotosResponseDTO,
  PreferenceAnswersDTO,
  ProfileDTO,
  QuestionDTO,
  SaveAnswersResponseDTO,
  SendGiftResponseDTO,
  SendMessageResponseDTO,
  StartVerificationResponseDTO,
  UnlockPerspective,
  UnlockResponseDTO,
  UnreadCountDTO,
  VoiceIntroResponseDTO,
} from "@soulsync/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  issues?: string[];
  // ISO timestamp for a chat-ban error — lets the UI format it in the viewer's own
  // timezone instead of showing whatever timezone the server happened to render in.
  chatBanUntil?: string;

  constructor(status: number, issues?: string[], chatBanUntil?: string) {
    super(issues?.length ? issues.join("; ") : `API request failed with status ${status}`);
    this.status = status;
    this.issues = issues;
    this.chatBanUntil = chatBanUntil;
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
      throw new ApiError(res.status, body.issues ?? (body.error ? [body.error] : undefined), body.chatBanUntil);
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
      throw new ApiError(res.status, body.issues ?? (body.error ? [body.error] : undefined), body.chatBanUntil);
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
    savePreferenceAnswers: (answers: Record<string, AnswerValue>) =>
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
    getMatches: () => request<MatchesResponseDTO>("/api/v1/matches"),
    getConversations: () => request<ConversationsResponseDTO>("/api/v1/conversations"),
    getMessages: (otherClerkId: string) => request<MessagesResponseDTO>(`/api/v1/conversations/${otherClerkId}/messages`),
    sendMessage: (otherClerkId: string, body: string) =>
      request<SendMessageResponseDTO>(`/api/v1/conversations/${otherClerkId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    unlockUser: (clerkId: string, perspective: UnlockPerspective) =>
      request<UnlockResponseDTO>(`/api/v1/unlocks/${clerkId}`, {
        method: "POST",
        body: JSON.stringify({ perspective }),
      }),
    startVerification: () => request<StartVerificationResponseDTO>("/api/v1/verification/start", { method: "POST" }),
    getUnreadCount: () => request<UnreadCountDTO>("/api/v1/conversations/unread-count"),
    sendVoiceMessage: (otherClerkId: string, blob: Blob, durationSec: number) => {
      const formData = new FormData();
      formData.append("audio", blob, "voice-message.webm");
      formData.append("durationSec", String(durationSec));
      return requestMultipart<SendMessageResponseDTO>(`/api/v1/conversations/${otherClerkId}/voice-messages`, "POST", formData);
    },
    editMessage: (messageId: string, body: string) =>
      request<SendMessageResponseDTO>(`/api/v1/conversations/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      }),
    deleteMessage: (messageId: string) =>
      request<SendMessageResponseDTO>(`/api/v1/conversations/messages/${messageId}`, { method: "DELETE" }),
    sendMediaMessage: (otherClerkId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return requestMultipart<SendMessageResponseDTO>(`/api/v1/conversations/${otherClerkId}/media`, "POST", formData);
    },
    getGiftCatalog: () => request<GiftCatalogResponseDTO>("/api/v1/gifts"),
    sendGift: (otherClerkId: string, giftId: string) =>
      request<SendGiftResponseDTO>(`/api/v1/conversations/${otherClerkId}/gifts`, {
        method: "POST",
        body: JSON.stringify({ giftId }),
      }),
    openGift: (messageId: string) =>
      request<SendMessageResponseDTO>(`/api/v1/conversations/messages/${messageId}/open`, { method: "POST" }),
    getNotifications: () => request<NotificationsResponseDTO>("/api/v1/notifications"),
    markAllNotificationsRead: () => request<{ ok: true }>("/api/v1/notifications/mark-all-read", { method: "POST" }),
    getCoinPackages: () => request<CoinPackagesResponseDTO>("/api/v1/coins/packages"),
    createCoinCheckout: (packageId: string) =>
      request<CreateCheckoutSessionResponseDTO>("/api/v1/coins/checkout", {
        method: "POST",
        body: JSON.stringify({ packageId }),
      }),
    createReport: (report: CreateReportRequestDTO) =>
      request<{ report: { id: string } }>("/api/v1/reports", { method: "POST", body: JSON.stringify(report) }),
    getBlockedClerkIds: () => request<BlockedClerkIdsResponseDTO>("/api/v1/blocks"),
    blockUser: (blockedClerkId: string) =>
      request<{ ok: true }>("/api/v1/blocks", { method: "POST", body: JSON.stringify({ blockedClerkId }) }),
    unblockUser: (blockedClerkId: string) => request<{ ok: true }>(`/api/v1/blocks/${blockedClerkId}`, { method: "DELETE" }),
    trackEvent: (event: string, properties?: Record<string, unknown>) =>
      request<{ ok: true }>("/api/v1/analytics/track", { method: "POST", body: JSON.stringify({ event, properties }) }).catch(
        () => {},
      ),
    exportMyData: async (): Promise<Blob> => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/me/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new ApiError(res.status);
      return res.blob();
    },
    deleteMyAccount: () => request<{ deleted: true }>("/api/v1/me", { method: "DELETE" }),
    getMobileTicket: () => request<{ ticket: string }>("/api/v1/auth/mobile-ticket", { method: "POST" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
