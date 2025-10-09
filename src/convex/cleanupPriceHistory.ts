import { internalMutation } from "./_generated/server";

// Cleanup redundant price history entries that are too close together
export const cleanupRedundantPriceHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    const TEN_MINUTES = 10 * 60 * 1000;
    let totalDeleted = 0;

    // Get all cards
    const cards = await ctx.db.query("cards").collect();

    for (const card of cards) {
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
      const entriesToKeep = [history[0]];
      let lastKeptTimestamp = history[0].timestamp;

      for (let i = 1; i < history.length - 1; i++) {
        const entry = history[i];
        const timeDiff = entry.timestamp - lastKeptTimestamp;

        if (timeDiff >= TEN_MINUTES) {
          entriesToKeep.push(entry);
          lastKeptTimestamp = entry.timestamp;
        } else {
          // Delete this redundant entry
          await ctx.db.delete(entry._id);
          totalDeleted++;
        }
      }

      // Always keep the last entry (most recent)
      entriesToKeep.push(history[history.length - 1]);
    }

    return { 
      cardsProcessed: cards.length, 
      entriesDeleted: totalDeleted 
    };
  },
});
