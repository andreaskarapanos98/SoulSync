import { AnalyticsEventModel, analyticsEventTypes } from "../models/AnalyticsEvent.js";

export { analyticsEventTypes };
export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

/** Never throws — a broken analytics write must not break the feature that triggered it. */
export async function track(clerkId: string, event: AnalyticsEventType, properties?: Record<string, unknown>): Promise<void> {
  try {
    await AnalyticsEventModel.create({ clerkId, event, properties });
  } catch (err) {
    console.error("Failed to record analytics event:", event, err);
  }
}

// The core activation funnel, in order — used by the admin funnel view to compute
// per-step unique-user counts and step-over-step drop-off.
export const FUNNEL_STEPS: { event: AnalyticsEventType; label: string }[] = [
  { event: "registration", label: "Registered" },
  { event: "onboarding_completed", label: "Completed questionnaire" },
  { event: "match_viewed", label: "Saw match" },
  { event: "voice_played", label: "Played voice" },
  { event: "profile_unlock_clicked", label: "Clicked unlock" },
  { event: "coin_purchase_completed", label: "Bought coins" },
  { event: "profile_unlocked", label: "Unlocked profile" },
  { event: "message_sent", label: "Sent message" },
];

export async function getFunnel(): Promise<{ event: AnalyticsEventType; label: string; uniqueUsers: number }[]> {
  const results = await Promise.all(
    FUNNEL_STEPS.map(async (step) => ({
      ...step,
      uniqueUsers: (await AnalyticsEventModel.distinct("clerkId", { event: step.event })).length,
    })),
  );
  return results;
}

export async function getEventCounts(): Promise<{ event: AnalyticsEventType; count: number; uniqueUsers: number }[]> {
  const results = await Promise.all(
    analyticsEventTypes.map(async (event) => {
      const [count, uniqueClerkIds] = await Promise.all([
        AnalyticsEventModel.countDocuments({ event }),
        AnalyticsEventModel.distinct("clerkId", { event }),
      ]);
      return { event, count, uniqueUsers: uniqueClerkIds.length };
    }),
  );
  return results;
}
