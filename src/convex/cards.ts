import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

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

// Get big movers from the past hour (cards with >3% change)
export const getBigMovers = query({
  args: { 
    hoursAgo: v.optional(v.number()),
    minPercentChange: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args): Promise<any[]> => {
    const hoursAgo = args.hoursAgo || 1;
    const minPercentChange = args.minPercentChange || 3;
    const limit = args.limit || 20;
    
    const timeThreshold = Date.now() - (hoursAgo * 60 * 60 * 1000);
    
    try {
      // Get all cards directly without expensive calculations
      const allCards = await ctx.db.query("cards").collect();
      
      // Filter for cards updated within time window
      const recentCards = allCards.filter(card => card.lastUpdated > timeThreshold);
      
      // For these recent cards only, calculate percentage change
      const cardsWithChanges = await Promise.all(
        recentCards.map(async (card) => {
          try {
            // Fetch only last 2 entries for percentage calculation
            const recentHistory = await ctx.db
              .query("cardPriceHistory")
              .withIndex("by_card", (q) => q.eq("cardId", card._id))
              .order("desc")
              .take(2);

            let percentChange = 0;
            if (recentHistory.length >= 2) {
              const current = recentHistory[0].price;
              const previous = recentHistory[1].price;
              if (previous !== 0) {
                percentChange = ((current - previous) / previous) * 100;
              }
            }

            return {
              ...card,
              percentChange,
              tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
            };
          } catch (error) {
            return {
              ...card,
              percentChange: 0,
              tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
            };
          }
        })
      );
      
      // Filter for significant changes and sort
      const bigMovers = cardsWithChanges
        .filter((card: any) => Math.abs(card.percentChange) > minPercentChange)
        .sort((a: any, b: any) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
        .slice(0, limit);

      return bigMovers;
    } catch (error) {
      console.error("Error fetching big movers:", error);
      return [];
    }
  },
});

// Internal query to get all cards with calculated changes (lightweight version)
export const _getAllCardsWithChanges = internalQuery({
  args: {},
  handler: async (ctx) => {
    try {
      const cards = await ctx.db.query("cards").collect();
      
      // Return cards with minimal calculation - just construct URLs
      const cardsWithData = cards.map((card) => {
        return {
          ...card,
          percentChange: 0, // Will be calculated on-demand
          overallPercentChange: 0,
          averagePrice: card.currentPrice,
          isRecentSale: false,
          tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
        };
      });

      return cardsWithData;
    } catch (error) {
      console.error("Error fetching cards with changes:", error);
      throw new Error("Failed to retrieve card data");
    }
  },
});

// Get all cards with their latest price changes (optimized)
export const getAllCards = query({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    try {
      // Get all cards with stored calculated values
      const cards = await ctx.db.query("cards").collect();
      
      // Return with constructed URLs and stored values
      return cards.map(card => ({
        ...card,
        percentChange: card.percentChange || 0,
        overallPercentChange: card.overallPercentChange || 0,
        averagePrice: card.averagePrice || card.currentPrice,
        isRecentSale: card.isRecentSale || false,
        tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
      }));
    } catch (error) {
      console.error("Error fetching all cards:", error);
      return [];
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
        // Calculate new percentage change
        const percentChange = ((args.currentPrice - existingCard.currentPrice) / existingCard.currentPrice) * 100;
        
        // Fetch limited history for calculations
        const recentHistory = await ctx.db
          .query("cardPriceHistory")
          .withIndex("by_card", (q) => q.eq("cardId", existingCard._id))
          .order("desc")
          .take(6);
        
        let overallPercentChange = existingCard.overallPercentChange || 0;
        let averagePrice = existingCard.currentPrice;
        let isRecentSale = false;
        
        // Calculate average from last 5 entries (excluding current)
        if (recentHistory.length >= 2) {
          const historicalPrices = recentHistory.slice(0, Math.min(5, recentHistory.length));
          averagePrice = historicalPrices.reduce((sum, h) => sum + h.price, 0) / historicalPrices.length;
          
          // Check if current price deviates significantly from average (>15%)
          const deviation = Math.abs((args.currentPrice - averagePrice) / averagePrice) * 100;
          isRecentSale = deviation > 15;
        }
        
        // Calculate overall trend if we have history
        if (recentHistory.length > 0) {
          const firstPrice = recentHistory[recentHistory.length - 1].price;
          if (firstPrice !== 0) {
            overallPercentChange = ((args.currentPrice - firstPrice) / firstPrice) * 100;
          }
        }
        
        // Update existing card with calculated values
        await ctx.db.patch(existingCard._id, {
          currentPrice: args.currentPrice,
          lastUpdated: now,
          percentChange,
          overallPercentChange,
          averagePrice,
          isRecentSale,
        });

        // Add price history entry
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
        percentChange: 0,
        overallPercentChange: 0,
        averagePrice: args.currentPrice,
        isRecentSale: false,
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