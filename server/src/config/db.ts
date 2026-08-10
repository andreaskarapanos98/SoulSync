import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  // mongoose's default autoIndex only CREATES indexes that are missing — it won't touch
  // an existing index whose keys match but whose options changed (e.g. adding a
  // partialFilterExpression), so a schema edit can silently leave the live index stale.
  // syncIndexes() diffs and drops/recreates as needed; cheap at this app's data volume.
  try {
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  } catch (err) {
    console.error("Index sync failed (continuing with existing indexes):", err);
  }
}
