import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all cards with their latest price changes
export const getAllCards = query({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    
    // Calculate price changes for each card
    const cardsWithChanges = await Promise.all(
      cards.map(async (card) => {
        const history = await ctx.db
          .query("cardPriceHistory")
          .withIndex("by_card", (q) => q.eq("cardId", card._id))
          .order("desc")
          .take(2);

        let percentChange = 0;
        if (history.length >= 2) {
          const current = history[0].price;
          const previous = history[1].price;
          percentChange = ((current - previous) / previous) * 100;
        }

        return {
          ...card,
          percentChange,
        };
      })
    );

    return cardsWithChanges;
  },
});

// Get price history for a specific card
export const getCardPriceHistory = query({
  args: { cardId: v.id("cards"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const history = await ctx.db
      .query("cardPriceHistory")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .order("desc")
      .take(limit);

    return history.reverse();
  },
});

// Add or update a card
export const upsertCard = mutation({
  args: {
    name: v.string(),
    setName: v.string(),
    cardNumber: v.string(),
    rarity: v.string(),
    imageUrl: v.optional(v.string()),
    currentPrice: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if card exists
    const existingCards = await ctx.db
      .query("cards")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .collect();

    const existingCard = existingCards.find(
      (c) => c.setName === args.setName && c.cardNumber === args.cardNumber
    );

    const now = Date.now();

    if (existingCard) {
      // Update existing card
      await ctx.db.patch(existingCard._id, {
        currentPrice: args.currentPrice,
        lastUpdated: now,
      });

      // Add price history entry
      await ctx.db.insert("cardPriceHistory", {
        cardId: existingCard._id,
        price: args.currentPrice,
        timestamp: now,
      });

      return existingCard._id;
    } else {
      // Create new card
      const cardId = await ctx.db.insert("cards", {
        name: args.name,
        setName: args.setName,
        cardNumber: args.cardNumber,
        rarity: args.rarity,
        imageUrl: args.imageUrl,
        currentPrice: args.currentPrice,
        lastUpdated: now,
      });

      // Add initial price history entry
      await ctx.db.insert("cardPriceHistory", {
        cardId,
        price: args.currentPrice,
        timestamp: now,
      });

      return cardId;
    }
  },
});
