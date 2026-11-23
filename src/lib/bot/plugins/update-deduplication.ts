import { eq, lt, sql } from "drizzle-orm";
import type { MiddlewareFn } from "grammy";

import { schema } from "@/db";

import type { BotContext } from "..";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const PROCESSING_LEASE_MS = 120_000;
const CLEANUP_INTERVAL = 500;

/**
 * Claims each Telegram update in D1 before running handlers.
 * Completed updates are ignored on Telegram retries; interrupted claims can be
 * reclaimed after a short lease. Failed handlers release their claim for retry.
 */
export function updateDeduplicationMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const updateId = ctx.update.update_id;
    const now = Date.now();

    if (updateId % CLEANUP_INTERVAL === 0) {
      await ctx.db
        .delete(schema.webhookUpdates)
        .where(lt(schema.webhookUpdates.updatedAt, now - RETENTION_MS));
    }

    const claim = await ctx.db.run(sql`
      INSERT INTO webhook_updates (update_id, status, updated_at)
      VALUES (${updateId}, 'processing', ${now})
      ON CONFLICT(update_id) DO UPDATE SET
        status = 'processing',
        updated_at = excluded.updated_at
      WHERE webhook_updates.status = 'processing'
        AND webhook_updates.updated_at <= ${now - PROCESSING_LEASE_MS}
    `);

    if (claim.meta.changes === 0) {
      const existing = await ctx.db.query.webhookUpdates.findFirst({
        columns: { status: true, updatedAt: true },
        where: (fields, operators) => operators.eq(fields.updateId, updateId),
      });
      if (existing?.status === "processed") return;

      // Never acknowledge an update that another request may still be processing.
      // A non-2xx response asks Telegram to retry after the active claim is released or expires.
      throw new Error(`Telegram update ${updateId} is already processing.`);
    }

    try {
      await next();
      await ctx.db
        .update(schema.webhookUpdates)
        .set({ status: "processed", updatedAt: Date.now() })
        .where(eq(schema.webhookUpdates.updateId, updateId));
    } catch (error) {
      try {
        await ctx.db.delete(schema.webhookUpdates).where(eq(schema.webhookUpdates.updateId, updateId));
      } catch {
        console.warn(`Could not release failed Telegram update claim ${updateId}.`);
      }
      throw error;
    }
  };
}
