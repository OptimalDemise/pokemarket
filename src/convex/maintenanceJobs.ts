import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Run all maintenance tasks
export const runWeeklyMaintenance = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting weekly maintenance...");
    
    // Enable maintenance mode
    await ctx.runMutation(internal.maintenance.enableMaintenance, {
      message: "Performing weekly maintenance: cleaning up old data, optimizing database, and running security checks. We'll be back shortly!",
    });
    
    try {
      // Run cleanup jobs
      console.log("Running price history cleanup...");
      await ctx.runMutation(internal.cards.cleanupOldPriceHistory, {});
      
      console.log("Running redundant price history cleanup...");
      await ctx.runAction(internal.cleanupPriceHistoryAll.cleanupAllRedundantPriceHistory, {});
      
      console.log("Running daily snapshots cleanup...");
      await ctx.runMutation(internal.dailySnapshots.cleanupOldSnapshots, {});
      
      // Add a small delay to ensure all operations complete
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      console.log("Weekly maintenance completed successfully");
    } catch (error) {
      console.error("Error during maintenance:", error);
      // Continue to disable maintenance mode even if there's an error
    } finally {
      // Always disable maintenance mode, even if there was an error
      await ctx.runMutation(internal.maintenance.disableMaintenance, {});
      console.log("Maintenance mode disabled");
    }
  },
});