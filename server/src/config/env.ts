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
  // Populated once we wire Clerk/Mongo in the next step.
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  mongoUri: process.env.MONGO_URI,
};
