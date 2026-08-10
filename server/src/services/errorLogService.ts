import { SystemErrorLogModel } from "../models/SystemErrorLog.js";

interface ErrorContext {
  source: string;
  path?: string;
  method?: string;
  statusCode?: number;
  clerkId?: string;
}

/** Never throws — logging a failure must not itself take down the request/process. */
export async function logSystemError(err: unknown, context: ErrorContext): Promise<void> {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    await SystemErrorLogModel.create({ message, stack, ...context });
  } catch (loggingErr) {
    console.error("Failed to write system error log:", loggingErr);
  }
}
