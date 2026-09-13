// One-off: "not_applicable" was removed from the facial_hair question's options (both
// about_me and preference sides) — see seedQuestions.ts. Any existing about_me answer
// still holding that value is now stale (not a selectable option any more), and since
// matchService.ts's facial_hair hard filter excludes a candidate whose value isn't
// checkable in any viewer's preference list, an orphaned "not_applicable" answer would
// silently lock that person out of every match once the option no longer exists to check.
// Maps it to "clean_shaven" — the closest remaining option semantically (no facial hair).
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";

async function main() {
  await mongoose.connect(env.mongoUri);
  const result = await AboutMeAnswerModel.updateMany(
    { "answers.facial_hair": "not_applicable" },
    { $set: { "answers.facial_hair": "clean_shaven" } },
  );
  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
