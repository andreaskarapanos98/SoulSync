// Uploaded media URLs used to always be a relative /uploads/... path served by our own
// API, so every call site prefixed them with API_URL. Now that storage is Cloudflare R2
// (storageService.ts), saveFile returns a full absolute URL instead — but rows written
// before that migration still hold the old relative form until the one-off migration
// script rewrites them. This makes both work everywhere a stored url is rendered,
// instead of every image/audio/video tag needing to know which era a given row is from.
export function mediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  return `${API_URL}${url}`;
}
