import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Wrapper action to cleanup all cards by running batches until completion
export const cleanupAllRedundantPriceHistory = internalAction({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;
    let totalCardsProcessed = 0;
    let cursor: string | undefined = undefined;
    let isDone = false;
    const BATCH_SIZE = 10;

    console.log("Starting full cleanup of redundant price history...");

    while (!isDone) {
      const result: {
        cardsProcessed: number;
        entriesDeleted: number;
        isDone: boolean;
        continueCursor?: string;
      } = await ctx.runMutation(
        internal.cleanupPriceHistory.cleanupRedundantPriceHistory,
        {
          batchSize: BATCH_SIZE,
          cursor: cursor,
        }
      );

      totalDeleted += result.entriesDeleted;
      totalCardsProcessed += result.cardsProcessed;
      isDone = result.isDone;
      cursor = result.continueCursor;

      console.log(
        `Processed ${result.cardsProcessed} cards, deleted ${result.entriesDeleted} entries. Total so far: ${totalCardsProcessed} cards, ${totalDeleted} deletions.`
      );

      // Add a small delay between batches to avoid overwhelming the system
      if (!isDone) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `Cleanup complete! Total cards processed: ${totalCardsProcessed}, Total entries deleted: ${totalDeleted}`
    );

    return {
      success: true,
      totalCardsProcessed,
      totalDeleted,
    };
  },
});
