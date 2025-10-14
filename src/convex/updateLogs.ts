import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

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

// Internal mutation to add update logs (no auth required - for admin CLI use)
export const addUpdateLogInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newLog = await ctx.db.insert("updateLogs", {
      title: args.title,
      description: args.description,
      category: args.category || "Update",
      timestamp: Date.now(),
    });

    return newLog;
  },
});

// Mutation to add a new update log (admin only in production)
export const addUpdateLog = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // TODO: Add admin role check here for production
    // const user = await ctx.db.query("users").filter(q => q.eq(q.field("email"), identity.email)).first();
    // if (user?.role !== "admin") {
    //   throw new Error("Unauthorized: Admin access required");
    // }

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