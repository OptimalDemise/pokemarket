import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Toggle favorite status for a card
 */
export const toggleFavorite = mutation({
  args: {
    cardId: v.id("cards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_card", (q) => 
        q.eq("userId", userId).eq("cardId", args.cardId)
      )
      .unique();

    if (existing) {
      // Remove from favorites
      await ctx.db.delete(existing._id);
      return { favorited: false };
    } else {
      // Add to favorites
      await ctx.db.insert("favorites", {
        userId,
        cardId: args.cardId,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});

/**
 * Get all favorited cards for the current user
 */
export const getUserFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return favorites.map(f => f.cardId);
  },
});

/**
 * Check if a specific card is favorited by the current user
 */
export const isFavorited = query({
  args: {
    cardId: v.id("cards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_card", (q) => 
        q.eq("userId", userId).eq("cardId", args.cardId)
      )
      .unique();

    return favorite !== null;
  },
});
