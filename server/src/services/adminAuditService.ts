import { AdminAuditLogModel } from "../models/AdminAuditLog.js";

export async function logAdminAction(
  adminClerkId: string,
  action: string,
  targetClerkId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await AdminAuditLogModel.create({ adminClerkId, action, targetClerkId, details });
}
