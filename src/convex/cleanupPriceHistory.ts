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
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const BATCH_SIZE = args.batchSize || 10; // Process 10 cards at a time to avoid read limits
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

      // Always keep first and last entries
      // For middle entries, only keep those at least 15 minutes apart
      const entriesToKeep = [history[0]]; // Always keep first
      
      for (let i = 1; i < history.length - 1; i++) {
        const entry = history[i];
        const lastKept = entriesToKeep[entriesToKeep.length - 1];
        const timeDiff = entry.timestamp - lastKept.timestamp;

        if (timeDiff >= FIFTEEN_MINUTES) {
          entriesToKeep.push(entry);
        } else {
          // Delete this redundant entry
          await ctx.db.delete(entry._id);
          totalDeleted++;
        }
      }
      
      // Always keep the last entry (most recent)
      // No need to add it to entriesToKeep since we're done processing
    }

    return { 
      cardsProcessed: cardsPage.page.length,
      entriesDeleted: totalDeleted,
      isDone: cardsPage.isDone,
      continueCursor: cardsPage.continueCursor,
    };
  },
});