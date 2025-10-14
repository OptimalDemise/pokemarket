import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Enhanced wrapper action with resumable progress tracking
// Processes a limited batch per execution, stores cursor, and can be resumed
export const cleanupAllRedundantPriceHistory = internalAction({
  args: {},
  handler: async (ctx) => {
    const MAX_BATCHES_PER_RUN = 50; // Process max 50 batches (150 cards) per cron execution
    const BATCH_SIZE = 3;
    
    // Get the stored cursor from last run
    const storedCursor = await ctx.runQuery(internal.updateProgress.getCleanupCursor);
    
    let totalDeleted = 0;
    let totalCardsProcessed = 0;
    let cursor: string | null | undefined = storedCursor;
    let batchCount = 0;

    console.log(`Starting cleanup from cursor: ${cursor || 'beginning'}`);

    while (batchCount < MAX_BATCHES_PER_RUN) {
      const result: {
        cardsProcessed: number;
        entriesDeleted: number;
        isDone: boolean;
        continueCursor?: string;
      } = await ctx.runMutation(
        internal.cleanupPriceHistory.cleanupRedundantPriceHistory,
        {
          batchSize: BATCH_SIZE,
          cursor: cursor || undefined,
        }
      );

      totalDeleted += result.entriesDeleted;
      totalCardsProcessed += result.cardsProcessed;
      batchCount++;

      // If we've finished all cards, reset cursor and exit
      if (result.isDone) {
        await ctx.runMutation(internal.updateProgress.setCleanupCursor, { cursor: null });
        console.log(`Cleanup complete! Processed ${totalCardsProcessed} cards, deleted ${totalDeleted} entries in this run.`);
        return {
          success: true,
          totalCardsProcessed,
          totalDeleted,
          isComplete: true,
        };
      }

      cursor = result.continueCursor;

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Save progress for next run
    await ctx.runMutation(internal.updateProgress.setCleanupCursor, { cursor: cursor || null });
    
    console.log(
      `Processed ${totalCardsProcessed} cards, deleted ${totalDeleted} entries in this run. Will resume next week.`
    );

    return {
      success: true,
      totalCardsProcessed,
      totalDeleted,
      isComplete: false,
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
    const BATCH_SIZE = 3;
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

      if (totalCardsProcessed >= MAX_CARDS || result.isDone) {
        break;
      }

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