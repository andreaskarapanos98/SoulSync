import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: required("NODE_ENV", "development"),
  clerkSecretKey: required("CLERK_SECRET_KEY"),
  clerkPublishableKey: required("CLERK_PUBLISHABLE_KEY"),
  mongoUri: required("MONGO_URI"),
  // Where Stripe Checkout redirects back to after payment. No web coin purchase flow
  // works without a browser to redirect, so this always has a usable default.
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  // Optional: unset in dev until Stripe keys are provided. Routes that need Stripe check
  // for these explicitly and return a clear error instead of crashing the whole server.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  // Bootstrap admin allowlist (comma-separated Clerk user IDs) — grants admin access
  // with no DB write needed before any account has role: "admin" set. Once at least one
  // admin exists, further admins can be granted via the dashboard's role field instead.
  adminClerkIds: (process.env.ADMIN_CLERK_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  // Cloudflare R2 (S3-compatible) — see storageService.ts.
  r2AccountId: required("R2_ACCOUNT_ID"),
  r2AccessKeyId: required("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  r2Bucket: required("R2_BUCKET"),
  // The bucket's public base URL (r2.dev for now, or a custom domain later) — never the
  // S3 API endpoint itself, which isn't publicly readable.
  r2PublicUrl: required("R2_PUBLIC_URL"),
  // Firebase Admin SDK service account, base64-encoded — see pushService.ts.
  firebaseServiceAccountB64: required("FIREBASE_SERVICE_ACCOUNT_B64"),
};
