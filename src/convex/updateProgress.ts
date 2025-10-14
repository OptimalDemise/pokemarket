import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Store the current pagination cursor for card updates
export const getUpdateCursor = internalQuery({
  args: {},
  handler: async (ctx) => {
    const progress = await ctx.db
      .query("updateProgress")
      .filter((q) => q.eq(q.field("type"), "cardUpdate"))
      .first();
    
    return progress?.cursor || null;
  },
});

export const setUpdateCursor = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("updateProgress")
      .filter((q) => q.eq(q.field("type"), "cardUpdate"))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        cursor: args.cursor,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("updateProgress", {
        type: "cardUpdate",
        cursor: args.cursor,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Store the current pagination cursor for price history cleanup
export const getCleanupCursor = internalQuery({
  args: {},
  handler: async (ctx) => {
    const progress = await ctx.db
      .query("updateProgress")
      .filter((q) => q.eq(q.field("type"), "priceHistoryCleanup"))
      .first();
    
    return progress?.cursor || null;
  },
});

export const setCleanupCursor = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("updateProgress")
      .filter((q) => q.eq(q.field("type"), "priceHistoryCleanup"))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        cursor: args.cursor,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("updateProgress", {
        type: "priceHistoryCleanup",
        cursor: args.cursor,
        lastUpdated: Date.now(),
      });
    }
  },
});