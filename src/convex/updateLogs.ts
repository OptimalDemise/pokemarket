import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to get all update logs, sorted by date (newest first)
export const getAllUpdateLogs = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("updateLogs")
      .order("desc")
      .collect();
    return logs;
  },
});

// Mutation to add a new update log (admin only in production)
export const addUpdateLog = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.optional(v.string()), // e.g., "Feature", "Bug Fix", "Improvement"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const newLog = await ctx.db.insert("updateLogs", {
      title: args.title,
      description: args.description,
      category: args.category || "Update",
      timestamp: Date.now(),
    });

    return newLog;
  },
});

// Mutation to delete an update log
export const deleteUpdateLog = mutation({
  args: {
    logId: v.id("updateLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.logId);
  },
});
