import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Helper function to construct TCGPlayer search URL
function constructTCGPlayerUrl(cardName: string, setName: string, cardNumber: string): string {
  // Create a search query for TCGPlayer
  const searchQuery = `${cardName} ${cardNumber} ${setName}`;
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Construct the TCGPlayer search URL
  return `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodedQuery}&view=grid`;
}

// Internal query to get all cards (for use by internal actions)
export const _getAllCards = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cards").collect();
  },
});

// Get all cards with their latest price changes
export const getAllCards = query({
  args: {},
  handler: async (ctx) => {
    try {
      const cards = await ctx.db.query("cards").collect();
      
      // Calculate price changes for each card using optimized queries
      const cardsWithChanges = await Promise.all(
        cards.map(async (card) => {
          try {
            // Fetch only the most recent entries needed for calculations
            const recentHistory = await ctx.db
              .query("cardPriceHistory")
              .withIndex("by_card", (q) => q.eq("cardId", card._id))
              .order("desc")
              .take(2);

            // Fetch first entry for overall trend
            const firstHistory = await ctx.db
              .query("cardPriceHistory")
              .withIndex("by_card", (q) => q.eq("cardId", card._id))
              .order("asc")
              .take(1);

            // Fetch last 6 entries for average calculation
            const avgHistory = await ctx.db
              .query("cardPriceHistory")
              .withIndex("by_card", (q) => q.eq("cardId", card._id))
              .order("desc")
              .take(6);

            let percentChange = 0;
            let overallPercentChange = 0;
            let averagePrice = card.currentPrice;
            let isRecentSale = false;
            
            // Calculate recent percentage change (last 2 entries)
            if (recentHistory.length >= 2) {
              const current = recentHistory[0].price;
              const previous = recentHistory[1].price;
              if (previous !== 0) {
                percentChange = ((current - previous) / previous) * 100;
              }
            }

            // Calculate overall trend (first to current)
            if (firstHistory.length > 0 && recentHistory.length > 0) {
              const firstPrice = firstHistory[0].price;
              const currentPrice = recentHistory[0].price;
              if (firstPrice !== 0) {
                overallPercentChange = ((currentPrice - firstPrice) / firstPrice) * 100;
              }
            }
            
            // Calculate average price from last 6 entries (excluding most recent)
            if (avgHistory.length >= 2) {
              const historicalPrices = avgHistory.slice(1);
              averagePrice = historicalPrices.reduce((sum, h) => sum + h.price, 0) / historicalPrices.length;
              
              // Check if current price deviates significantly from average (>15%)
              const current = avgHistory[0].price;
              const deviation = Math.abs((current - averagePrice) / averagePrice) * 100;
              isRecentSale = deviation > 15;
            }

            // Construct proper TCGPlayer URL
            const tcgplayerUrl = constructTCGPlayerUrl(card.name, card.setName, card.cardNumber);
            
            return {
              ...card,
              percentChange,
              overallPercentChange,
              averagePrice,
              isRecentSale,
              tcgplayerUrl,
            };
          } catch (error) {
            console.error(`Error calculating price change for card ${card._id}:`, error);
            return {
              ...card,
              percentChange: 0,
              overallPercentChange: 0,
              averagePrice: card.currentPrice,
              isRecentSale: false,
              tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
            };
          }
        })
      );

      return cardsWithChanges;
    } catch (error) {
      console.error("Error fetching cards:", error);
      throw new Error("Failed to retrieve card data");
    }
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

// Add or update a card (internal for API actions to call)
export const upsertCard = internalMutation({
  args: {
    name: v.string(),
    setName: v.string(),
    cardNumber: v.string(),
    rarity: v.string(),
    imageUrl: v.optional(v.string()),
    tcgplayerUrl: v.optional(v.string()),
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
      // Check if price has actually changed (more than 0.1% difference)
      const priceChangePercent = Math.abs((args.currentPrice - existingCard.currentPrice) / existingCard.currentPrice) * 100;
      const hasPriceChanged = priceChangePercent > 0.1;

      if (hasPriceChanged) {
        // Update existing card only if price changed
        await ctx.db.patch(existingCard._id, {
          currentPrice: args.currentPrice,
          lastUpdated: now,
        });

        // Add price history entry - no artificial variation
        await ctx.db.insert("cardPriceHistory", {
          cardId: existingCard._id,
          price: args.currentPrice,
          timestamp: now,
        });
      }

      return existingCard._id;
    } else {
      // Create new card
      const cardId = await ctx.db.insert("cards", {
        name: args.name,
        setName: args.setName,
        cardNumber: args.cardNumber,
        rarity: args.rarity,
        imageUrl: args.imageUrl,
        tcgplayerUrl: args.tcgplayerUrl,
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

// Cleanup old price history (keep last 90 days)
export const cleanupOldPriceHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    const oldEntries = await ctx.db
      .query("cardPriceHistory")
      .filter((q) => q.lt(q.field("timestamp"), ninetyDaysAgo))
      .collect();
    
    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }
    
    return { deleted: oldEntries.length };
  },
});