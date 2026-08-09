import type { PointGivingQuestion } from "./scoringEngine.js";

const DONT_CARE = "no_preference";

/**
 * mini_scale covers two different confirmed behaviors:
 *  - at_least / at_most: the viewer picks one threshold point on an ordered option list
 *    (e.g. smoking: never < occasionally < regularly < daily) and anyone on the wrong
 *    side of it is ELIMINATED — same as a hard filter, just viewer-specific instead of
 *    universal. "at_least" for achievement-style traits (education), "at_most" for
 *    vice-tolerance traits (smoking, vaping, alcohol, tattoos, piercings).
 *  - stepped_distance: no elimination — points fall off with ordinal distance from the
 *    viewer's target. The exact tiered percentage table was never pinned down (an
 *    earlier gap — the distance=1 tier specifically — was flagged and never resolved),
 *    so this uses a linear-decay placeholder at 20% per step (steeper than ranking's
 *    confirmed 10%/step) — at fullPoints ~2.7, a 10%/step penalty (~0.27) is smaller
 *    than the 0.5 needed to move the final rounded percentage at all, making a single
 *    one-step mismatch invisible in the displayed score. Replace `steppedDistanceDecay`
 *    below with the real table once it's confirmed.
 * Two keys (morning_or_night, wants_children) don't fit either shape and get their own
 * dedicated scorers.
 */
const MINI_SCALE_BEHAVIOR: Record<
  string,
  "at_least" | "at_most" | "stepped_distance" | "morning_or_night" | "wants_children"
> = {
  education: "at_least",
  has_tattoos: "at_most",
  has_piercings: "at_most",
  smoking: "at_most",
  vaping: "at_most",
  alcohol: "at_most",
  exercise: "stepped_distance",
  travel_frequency: "stepped_distance",
  social_lifestyle: "stepped_distance",
  fitness_level: "stepped_distance",
  introvert_extrovert: "stepped_distance",
  calm_energetic: "stepped_distance",
  organized_spontaneous: "stepped_distance",
  romantic_practical: "stepped_distance",
  affection_level: "stepped_distance",
  quality_time_importance: "stepped_distance",
  gifts_importance: "stepped_distance",
  morning_or_night: "morning_or_night",
  wants_children: "wants_children",
};

// "must"/"prefer" is a strict/soft gradient on the same direction — must_* is a hard
// 0-or-full outcome, prefer_* softens a mismatch to half credit instead of zero. This
// mapping was never explicitly given by the user; flagged as an assumption.
const WANTS_CHILDREN_TABLE: Record<string, Record<string, number>> = {
  must_not_want: { no: 1, yes: 0, already_have: 0 },
  prefer_not_want: { no: 1, yes: 0.5, already_have: 0.5 },
  doesnt_matter: { no: 1, yes: 1, already_have: 1 },
  prefer_want: { no: 0.5, yes: 1, already_have: 1 },
  must_want: { no: 0, yes: 1, already_have: 1 },
};

function optionIndex(options: { value: string }[] | undefined, val: unknown): number {
  if (!options || typeof val !== "string") return -1;
  return options.findIndex((o) => o.value === val);
}

/** ranking's confirmed linear decay: -10% per rank step. */
function rankingDecay(fullPoints: number, distance: number): number {
  return fullPoints * Math.max(0, 1 - 0.1 * distance);
}

/**
 * stepped_distance placeholder decay: -20% per step, not ranking's 10%. At fullPoints
 * ~2.7, a 10%/step penalty is only ~0.27 — smaller than the 0.5 needed to move the
 * final rounded percentage, so a single one-step mismatch would round away to
 * invisible. 20%/step (~0.54 at distance 1) actually registers.
 */
function steppedDistanceDecay(fullPoints: number, distance: number): number {
  return fullPoints * Math.max(0, 1 - 0.2 * distance);
}

/** True if this mini_scale question's viewer threshold eliminates the candidate. */
export function miniScaleThresholdEliminates(
  question: PointGivingQuestion,
  viewerTarget: unknown,
  candidateValue: unknown,
): boolean {
  const behavior = MINI_SCALE_BEHAVIOR[question.key];
  if (behavior !== "at_least" && behavior !== "at_most") return false;
  if (viewerTarget === undefined || viewerTarget === DONT_CARE) return false;
  const targetIndex = optionIndex(question.options, viewerTarget);
  const candidateIndex = optionIndex(question.options, candidateValue);
  if (targetIndex === -1 || candidateIndex === -1) return false;
  return behavior === "at_least" ? candidateIndex < targetIndex : candidateIndex > targetIndex;
}

/**
 * relative_self height_cm: "taller"/"shorter" compare the candidate to the VIEWER's own
 * about_me height, "near" allows ±10%. Missing height data never eliminates (can't
 * evaluate, so don't punish).
 */
export function heightEliminates(
  viewerPrefValue: unknown,
  viewerOwnHeightCm: number | undefined,
  candidateHeightCm: number | undefined,
): boolean {
  if (viewerPrefValue === DONT_CARE || viewerPrefValue === undefined) return false;
  if (viewerOwnHeightCm === undefined || candidateHeightCm === undefined) return false;
  if (viewerPrefValue === "taller") return candidateHeightCm <= viewerOwnHeightCm;
  if (viewerPrefValue === "shorter") return candidateHeightCm >= viewerOwnHeightCm;
  if (viewerPrefValue === "near") return Math.abs(candidateHeightCm - viewerOwnHeightCm) > viewerOwnHeightCm * 0.1;
  return false;
}

/** checklist: any overlap earns full points; zero overlap earns `zeroOverlapFraction`. */
function scoreChecklist(
  candidateValues: string[],
  acceptedValues: string[],
  fullPoints: number,
  zeroOverlapFraction: number,
): number {
  const overlap = candidateValues.some((v) => acceptedValues.includes(v));
  return overlap ? fullPoints : fullPoints * zeroOverlapFraction;
}

/** ranking: linear rank decay — fullPoints x (1 - 0.1 x (rank - 1)). Empty = "I don't care". */
function scoreRanking(viewerOrder: unknown, candidateValue: unknown, fullPoints: number): number {
  if (!Array.isArray(viewerOrder) || viewerOrder.length === 0) return fullPoints;
  const idx = viewerOrder.indexOf(candidateValue as string);
  if (idx === -1) return 0;
  return rankingDecay(fullPoints, idx);
}

function scoreSteppedDistance(
  question: PointGivingQuestion,
  viewerTarget: unknown,
  candidateValue: unknown,
  fullPoints: number,
): number {
  if (viewerTarget === DONT_CARE) return fullPoints;
  const viewerNum = typeof viewerTarget === "number" ? viewerTarget : optionIndex(question.options, viewerTarget);
  const candidateNum = typeof candidateValue === "number" ? candidateValue : optionIndex(question.options, candidateValue);
  if (viewerTarget === undefined || candidateValue === undefined || viewerNum === -1 || candidateNum === -1) {
    return fullPoints; // can't evaluate — don't punish
  }
  return steppedDistanceDecay(fullPoints, Math.abs(candidateNum - viewerNum));
}

// "both" satisfies either preference — confirmed explicitly by the user.
function scoreMorningNight(viewerTarget: unknown, candidateValue: unknown, fullPoints: number): number {
  if (viewerTarget === DONT_CARE || viewerTarget === undefined) return fullPoints;
  if (candidateValue === "both") return fullPoints;
  return candidateValue === viewerTarget ? fullPoints : 0;
}

function scoreWantsChildren(viewerTarget: unknown, candidateValue: unknown, fullPoints: number): number {
  if (typeof viewerTarget !== "string" || typeof candidateValue !== "string") return fullPoints;
  const row = WANTS_CHILDREN_TABLE[viewerTarget];
  if (!row || !(candidateValue in row)) return fullPoints;
  return fullPoints * row[candidateValue];
}

export interface ScoreContext {
  questions: PointGivingQuestion[];
  fullPoints: number;
  viewerPreferences: Record<string, unknown>;
  candidateAboutMe: Record<string, unknown>;
}

/**
 * Sums points across every point-giving question for a candidate that has already
 * survived every elimination gate (hard filters, relative_self, deal breakers,
 * languages, mini_scale thresholds). Binary-gate mechanics contribute fullPoints
 * automatically here since surviving IS passing; only the genuinely graded mechanics
 * (checklist pets/hobbies, ranking, stepped-distance mini_scale, morning_or_night,
 * wants_children) are actually computed.
 */
export function computeScore({ questions, fullPoints, viewerPreferences, candidateAboutMe }: ScoreContext): number {
  let total = 0;

  for (const q of questions) {
    switch (q.scoringMechanic) {
      case "hard_filter":
        total += fullPoints;
        break;

      case "relative_self":
        total += fullPoints;
        break;

      case "checklist":
        if (q.key === "pets") {
          total += scoreChecklist((candidateAboutMe.pets as string[]) ?? [], (viewerPreferences.pets as string[]) ?? [], fullPoints, 0);
        } else if (q.key === "hobbies") {
          total += scoreChecklist((candidateAboutMe.hobbies as string[]) ?? [], (viewerPreferences.hobbies as string[]) ?? [], fullPoints, 0.5);
        } else {
          // languages: zero-overlap already eliminated, so surviving = full points.
          total += fullPoints;
        }
        break;

      case "mini_scale": {
        const behavior = MINI_SCALE_BEHAVIOR[q.key];
        if (behavior === "at_least" || behavior === "at_most") {
          total += fullPoints; // threshold gate already eliminated non-survivors
        } else if (behavior === "stepped_distance") {
          total += scoreSteppedDistance(q, viewerPreferences[q.key], candidateAboutMe[q.key], fullPoints);
        } else if (behavior === "morning_or_night") {
          total += scoreMorningNight(viewerPreferences[q.key], candidateAboutMe[q.key], fullPoints);
        } else if (behavior === "wants_children") {
          total += scoreWantsChildren(viewerPreferences[q.key], candidateAboutMe[q.key], fullPoints);
        }
        break;
      }

      case "ranking":
        total += scoreRanking(viewerPreferences[q.key], candidateAboutMe[q.key], fullPoints);
        break;
    }
  }

  return total;
}
