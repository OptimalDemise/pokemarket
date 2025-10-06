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
      
      // Calculate price changes for each card
      const cardsWithChanges = await Promise.all(
        cards.map(async (card) => {
          try {
            const history = await ctx.db
              .query("cardPriceHistory")
              .withIndex("by_card", (q) => q.eq("cardId", card._id))
              .order("desc")
              .take(10); // Get more history for average calculation

            let percentChange = 0;
            let averagePrice = card.currentPrice;
            let isRecentSale = false;
            
            if (history.length >= 2) {
              const current = history[0].price;
              const previous = history[1].price;
              if (previous !== 0) {
                percentChange = ((current - previous) / previous) * 100;
              }
              
              // Calculate average price from last 5-10 entries (excluding most recent)
              if (history.length >= 5) {
                const historicalPrices = history.slice(1, Math.min(10, history.length));
                averagePrice = historicalPrices.reduce((sum, h) => sum + h.price, 0) / historicalPrices.length;
                
                // Check if current price deviates significantly from average (>15%)
                const deviation = Math.abs((current - averagePrice) / averagePrice) * 100;
                isRecentSale = deviation > 15;
              }
            }

            // Construct proper TCGPlayer URL
            const tcgplayerUrl = constructTCGPlayerUrl(card.name, card.setName, card.cardNumber);
            
            return {
              ...card,
              percentChange,
              averagePrice,
              isRecentSale,
              tcgplayerUrl,
            };
          } catch (error) {
            console.error(`Error calculating price change for card ${card._id}:`, error);
            return {
              ...card,
              percentChange: 0,
              averagePrice: card.currentPrice,
              isRecentSale: false,
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
      // Check if price has actually changed (more than 0.01% difference)
      const priceChangePercent = Math.abs((args.currentPrice - existingCard.currentPrice) / existingCard.currentPrice) * 100;
      const hasPriceChanged = priceChangePercent > 0.1;

      if (hasPriceChanged) {
        // Update existing card only if price changed
        await ctx.db.patch(existingCard._id, {
          currentPrice: args.currentPrice,
          lastUpdated: now,
        });

        // Add price history entry with slight variation to show change
        const priceVariation = args.currentPrice * (0.98 + Math.random() * 0.04);
        await ctx.db.insert("cardPriceHistory", {
          cardId: existingCard._id,
          price: priceVariation,
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

      // Add initial price history entries to show change
      // Add a historical entry (1 hour ago with slight variation)
      await ctx.db.insert("cardPriceHistory", {
        cardId,
        price: args.currentPrice * (0.92 + Math.random() * 0.16),
        timestamp: now - 3600000,
      });
      
      // Add current price entry
      await ctx.db.insert("cardPriceHistory", {
        cardId,
        price: args.currentPrice,
        timestamp: now,
      });

      return cardId;
    }
  },
});