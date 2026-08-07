import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);

app.listen(env.port, () => {
  console.log(`SoulSync API listening on http://localhost:${env.port}`);
});
