import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Cleanup redundant price history entries that are too close together
// Processes cards in batches to avoid hitting read limits
export const cleanupRedundantPriceHistory = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const TEN_MINUTES = 10 * 60 * 1000;
    const BATCH_SIZE = args.batchSize || 50; // Process 50 cards at a time
    let totalDeleted = 0;

    // Get a batch of cards using pagination
    const cardsPage = await ctx.db
      .query("cards")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor || null });

    for (const card of cardsPage.page) {
      // Get all price history for this card, sorted by timestamp
      const history = await ctx.db
        .query("cardPriceHistory")
        .withIndex("by_card", (q) => q.eq("cardId", card._id))
        .order("asc")
        .collect();

      if (history.length <= 2) {
        // Keep at least 2 entries for percentage calculations
        continue;
      }

      // Keep first entry, then only keep entries that are at least 10 minutes apart
      let lastKeptTimestamp = history[0].timestamp;

      for (let i = 1; i < history.length - 1; i++) {
        const entry = history[i];
        const timeDiff = entry.timestamp - lastKeptTimestamp;

        if (timeDiff >= TEN_MINUTES) {
          lastKeptTimestamp = entry.timestamp;
        } else {
          // Delete this redundant entry
          await ctx.db.delete(entry._id);
          totalDeleted++;
        }
      }
    }

    return { 
      cardsProcessed: cardsPage.page.length,
      entriesDeleted: totalDeleted,
      isDone: cardsPage.isDone,
      continueCursor: cardsPage.continueCursor,
    };
  },
});
