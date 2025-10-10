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
    try {
      return await ctx.db.query("cards").collect();
    } catch (error) {
      console.error("Error fetching all cards:", error);
      throw new Error("Failed to retrieve cards data");
    }
  },
});

// New: Paginated batch query for processing cards in chunks
export const _getCardsBatch = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const result = await ctx.db
        .query("cards")
        .paginate({
          numItems: args.batchSize,
          cursor: args.cursor,
        });
      
      return result;
    } catch (error) {
      console.error("Error fetching cards batch:", error);
      throw new Error("Failed to retrieve cards batch");
    }
  },
});

// Get big movers with hourly caching - optimized for high concurrency
export const getBigMovers = query({
  args: { 
    hoursAgo: v.optional(v.number()),
    minPercentChange: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args): Promise<any[]> => {
    // Validate and sanitize inputs
    const minPercentChange = Math.max(0, Math.min(100, args.minPercentChange || 3));
    const limit = Math.max(1, Math.min(100, args.limit || 20));
    
    // Calculate current hour period (rounds down to the hour)
    const now = Date.now();
    const currentHourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    
    try {
      // Get cached big movers for current hour period using indexed query
      const cachedMovers = await ctx.db
        .query("bigMoversCache")
        .withIndex("by_hour_period", (q) => q.eq("hourPeriodStart", currentHourStart))
        .order("desc")
        .take(limit);
      
      // If we have cached movers, fetch their current card data in batch
      if (cachedMovers.length > 0) {
        // Batch fetch all cards at once for better performance
        const cards = await Promise.all(
          cachedMovers.map(m => ctx.db.get(m.cardId))
        );
        
        // Filter and map in a single pass for efficiency
        const validCards = cards
          .filter((card): card is NonNullable<typeof card> => {
            if (!card) return false;
            const change = typeof card.percentChange === 'number' ? Math.abs(card.percentChange) : 0;
            return change >= minPercentChange;
          })
          .map((card) => ({
            ...card,
            percentChange: card.percentChange || 0,
            overallPercentChange: card.overallPercentChange || 0,
            averagePrice: card.averagePrice || card.currentPrice,
            isRecentSale: card.isRecentSale || false,
            tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
          }))
          .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
        
        return validCards;
      }
      
      // No cache exists, return empty (will be populated by background job)
      return [];
    } catch (error) {
      console.error("Error fetching big movers:", error);
      // Return empty array to prevent client crashes
      return [];
    }
  },
});

// Internal mutation to update big movers cache
export const updateBigMoversCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentHourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    try {
      // Get all cards updated in the last hour with significant changes
      const recentCards = await ctx.db
        .query("cards")
        .withIndex("by_last_updated", (q) => q.gt("lastUpdated", oneHourAgo))
        .collect();
      
      // Filter for cards with >3% change
      const significantMovers = recentCards
        .filter((card) => {
          const change = card.percentChange || 0;
          return Math.abs(change) > 3;
        })
        .sort((a, b) => Math.abs(b.percentChange || 0) - Math.abs(a.percentChange || 0))
        .slice(0, 20);
      
      // Get existing cache for current hour
      const existingCache = await ctx.db
        .query("bigMoversCache")
        .withIndex("by_hour_period", (q) => q.eq("hourPeriodStart", currentHourStart))
        .collect();
      
      // Create a map of existing cached cards
      const existingMap = new Map(
        existingCache.map(c => [c.cardId, c])
      );
      
      // Update or insert new movers
      for (let i = 0; i < significantMovers.length; i++) {
        const card = significantMovers[i];
        const existing = existingMap.get(card._id);
        const absChange = Math.abs(card.percentChange || 0);
        
        if (existing) {
          // Only update if new change is higher
          if (absChange > Math.abs(existing.percentChange)) {
            await ctx.db.patch(existing._id, {
              percentChange: card.percentChange || 0,
              rank: i + 1,
            });
          }
        } else {
          // Insert new entry
          await ctx.db.insert("bigMoversCache", {
            cardId: card._id,
            percentChange: card.percentChange || 0,
            hourPeriodStart: currentHourStart,
            rank: i + 1,
          });
        }
      }
      
      // Clean up old hour periods (older than 2 hours)
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);
      const oldHourStart = Math.floor(twoHoursAgo / (60 * 60 * 1000)) * (60 * 60 * 1000);
      
      const oldEntries = await ctx.db
        .query("bigMoversCache")
        .withIndex("by_hour_period", (q) => q.lt("hourPeriodStart", oldHourStart))
        .collect();
      
      for (const entry of oldEntries) {
        await ctx.db.delete(entry._id);
      }
      
      return { updated: significantMovers.length, cleaned: oldEntries.length };
    } catch (error) {
      console.error("Error updating big movers cache:", error);
      throw error;
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

// Get all cards with their latest price changes (optimized for high concurrency)
export const getAllCards = query({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    try {
      // Get all cards with stored calculated values
      // Using collect() is fine here as it's optimized by Convex for read-heavy workloads
      const cards = await ctx.db.query("cards").collect();
      
      // Pre-calculate all URLs in batch to avoid repeated function calls
      const cardsWithData = cards.map(card => {
        // Ensure all numeric fields have valid defaults
        const percentChange = typeof card.percentChange === 'number' ? card.percentChange : 0;
        const overallPercentChange = typeof card.overallPercentChange === 'number' ? card.overallPercentChange : 0;
        const averagePrice = typeof card.averagePrice === 'number' ? card.averagePrice : card.currentPrice;
        const isRecentSale = typeof card.isRecentSale === 'boolean' ? card.isRecentSale : false;
        
        return {
          ...card,
          percentChange,
          overallPercentChange,
          averagePrice,
          isRecentSale,
          tcgplayerUrl: constructTCGPlayerUrl(card.name, card.setName, card.cardNumber),
        };
      });
      
      return cardsWithData;
    } catch (error) {
      console.error("Error fetching all cards:", error);
      // Return empty array instead of throwing to prevent client crashes
      return [];
    }
  },
});

// Get price history for a specific card
export const getCardPriceHistory = query({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("cardPriceHistory")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .order("desc")
      .collect();

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
    try {
      // Validate input
      if (args.currentPrice < 0) {
        console.error(`Invalid price for card ${args.name}: ${args.currentPrice}`);
        return null;
      }

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
        // Validate existing card data
        if (!existingCard.currentPrice || existingCard.currentPrice <= 0) {
          console.warn(`Invalid existing price for card ${args.name}, resetting`);
          existingCard.currentPrice = args.currentPrice;
        }

        // Check if price has actually changed (more than 0.1% difference)
        const priceChangePercent = Math.abs((args.currentPrice - existingCard.currentPrice) / existingCard.currentPrice) * 100;
        const hasPriceChanged = priceChangePercent > 0.1;
        
        // Check if it's been more than 10 minutes since last history entry (for chart data points)
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        const shouldRecordPeriodically = existingCard.lastUpdated < tenMinutesAgo;

        // Always update lastUpdated for live updates display, but only record history every 10 min or on significant change
        if (hasPriceChanged || shouldRecordPeriodically) {
          // Calculate new percentage change with safety check
          let percentChange = 0;
          if (existingCard.currentPrice !== 0) {
            percentChange = ((args.currentPrice - existingCard.currentPrice) / existingCard.currentPrice) * 100;
          }
          
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
            const sum = historicalPrices.reduce((sum, h) => sum + h.price, 0);
            averagePrice = sum / historicalPrices.length;
            
            // Check if current price deviates significantly from average (>10%)
            // AND if the last update was within the last hour (3600000 ms)
            const oneHourAgo = now - (60 * 60 * 1000);
            if (averagePrice !== 0) {
              const deviation = Math.abs((args.currentPrice - averagePrice) / averagePrice) * 100;
              // Only mark as recent sale if deviation is significant AND it's been less than an hour
              isRecentSale = deviation > 10 && existingCard.lastUpdated > oneHourAgo;
            }
          }
          
          // Calculate overall trend from the very first recorded price
          const firstHistoryEntry = await ctx.db
            .query("cardPriceHistory")
            .withIndex("by_card", (q) => q.eq("cardId", existingCard._id))
            .order("asc")
            .first();
          
          if (firstHistoryEntry && firstHistoryEntry.price !== 0) {
            const firstPrice = firstHistoryEntry.price;
            overallPercentChange = ((args.currentPrice - firstPrice) / firstPrice) * 100;
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

          // Add price history entry ONLY for significant changes OR 30-minute intervals (for chart data)
          await ctx.db.insert("cardPriceHistory", {
            cardId: existingCard._id,
            price: args.currentPrice,
            timestamp: now,
          });
        } else {
          // Price hasn't changed significantly and it's not time for 30-min update
          // Still update lastUpdated for live updates display, but don't add history entry
          // However, we still need to maintain the existing percentChange value
          await ctx.db.patch(existingCard._id, {
            lastUpdated: now,
            // Keep existing calculated values so they don't reset to 0
            percentChange: existingCard.percentChange || 0,
            overallPercentChange: existingCard.overallPercentChange || 0,
            averagePrice: existingCard.averagePrice || existingCard.currentPrice,
            isRecentSale: existingCard.isRecentSale || false,
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

        // Seed with two initial price history entries for immediate graph visualization
        // Add a historical entry (1 hour ago) with slight variation
        const oneHourAgo = now - (60 * 60 * 1000);
        const historicalPrice = parseFloat((args.currentPrice * (0.98 + Math.random() * 0.04)).toFixed(2));
        
        await ctx.db.insert("cardPriceHistory", {
          cardId,
          price: historicalPrice,
          timestamp: oneHourAgo,
        });

        // Add current price entry
        await ctx.db.insert("cardPriceHistory", {
          cardId,
          price: args.currentPrice,
          timestamp: now,
        });

        return cardId;
      }
    } catch (error) {
      console.error(`Error upserting card ${args.name}:`, error);
      throw new Error(`Failed to upsert card: ${error instanceof Error ? error.message : 'Unknown error'}`);
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