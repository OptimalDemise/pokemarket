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
    const BATCH_SIZE = 3; // Reduced from 10 to 3 to avoid read limits

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

// Test version that processes only 50 cards
export const testCleanup50Cards = internalAction({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;
    let totalCardsProcessed = 0;
    let cursor: string | undefined = undefined;
    const BATCH_SIZE = 3; // Reduced from 10 to 3 to avoid read limits
    const MAX_CARDS = 50;

    console.log("Starting test cleanup of 50 cards...");

    while (totalCardsProcessed < MAX_CARDS) {
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
      cursor = result.continueCursor;

      console.log(
        `Processed ${result.cardsProcessed} cards, deleted ${result.entriesDeleted} entries. Total so far: ${totalCardsProcessed} cards, ${totalDeleted} deletions.`
      );

      // Stop if we've processed 50 cards or if there are no more cards
      if (totalCardsProcessed >= MAX_CARDS || result.isDone) {
        break;
      }

      // Add a small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `Test cleanup complete! Total cards processed: ${totalCardsProcessed}, Total entries deleted: ${totalDeleted}`
    );

    return {
      success: true,
      totalCardsProcessed,
      totalDeleted,
    };
  },
});