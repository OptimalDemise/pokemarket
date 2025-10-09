import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to construct TCGPlayer search URL
function constructTCGPlayerUrl(cardName: string, setName: string, cardNumber: string): string {
  const searchQuery = `${cardName} ${cardNumber} ${setName}`;
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodedQuery}&view=grid`;
}

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

    // Fetch full card data for each favorite
    const cards = await Promise.all(
      favorites.map(async (f) => {
        const card = await ctx.db.get(f.cardId);
        return card;
      })
    );

    // Filter out any null cards and return with TCGPlayer URLs
    return cards
      .filter((card): card is NonNullable<typeof card> => card !== null)
      .map((card) => ({
        ...card,
        percentChange: card.percentChange || 0,
        overallPercentChange: card.overallPercentChange || 0,
        averagePrice: card.averagePrice || card.currentPrice,
        isRecentSale: card.isRecentSale || false,
        tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
      }));
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
