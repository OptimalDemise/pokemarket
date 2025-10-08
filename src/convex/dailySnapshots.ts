import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Create daily snapshots for all cards and products
export const createDailySnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = Date.now();

    // Get all cards
    const cards = await ctx.db.query("cards").collect();
    
    for (const card of cards) {
      // Check if snapshot already exists for today
      const existing = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_item_and_date", (q) => 
          q.eq("itemId", card._id).eq("snapshotDate", today)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("dailySnapshots", {
          itemId: card._id,
          itemType: "card",
          itemName: card.name,
          price: card.currentPrice,
          snapshotDate: today,
          timestamp: now,
        });
      }
    }

    // Get all products
    const products = await ctx.db.query("products").collect();
    
    for (const product of products) {
      const existing = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_item_and_date", (q) => 
          q.eq("itemId", product._id).eq("snapshotDate", today)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("dailySnapshots", {
          itemId: product._id,
          itemType: "product",
          itemName: product.name,
          price: product.currentPrice,
          snapshotDate: today,
          timestamp: now,
        });
      }
    }

    return { success: true, date: today };
  },
});

// Get top daily changes (optimized for high concurrency)
export const getTopDailyChanges = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Validate and sanitize limit
    const limit = Math.max(1, Math.min(100, args.limit || 10));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Fetch both snapshots in parallel for better performance
      const [todaySnapshots, yesterdaySnapshots] = await Promise.all([
        ctx.db
          .query("dailySnapshots")
          .withIndex("by_date", (q) => q.eq("snapshotDate", today))
          .collect(),
        ctx.db
          .query("dailySnapshots")
          .withIndex("by_date", (q) => q.eq("snapshotDate", yesterday))
          .collect()
      ]);

      // Create a map of yesterday's prices for O(1) lookup
      const yesterdayPrices = new Map(
        yesterdaySnapshots.map(s => [s.itemId, s.price])
      );

      // Calculate changes efficiently
      const cardChanges: Array<{ 
        itemId: string; 
        percentChange: number; 
        todayPrice: number; 
        yesterdayPrice: number 
      }> = [];
      
      for (const todaySnapshot of todaySnapshots) {
        // Only process cards
        if (todaySnapshot.itemType !== "card") continue;
        
        const yesterdayPrice = yesterdayPrices.get(todaySnapshot.itemId);
        
        // Validate prices to prevent division by zero
        if (yesterdayPrice && yesterdayPrice > 0 && todaySnapshot.price >= 0) {
          const percentChange = ((todaySnapshot.price - yesterdayPrice) / yesterdayPrice) * 100;
          
          // Only include if there's an actual change
          if (!isNaN(percentChange) && isFinite(percentChange)) {
            cardChanges.push({
              itemId: todaySnapshot.itemId,
              percentChange,
              todayPrice: todaySnapshot.price,
              yesterdayPrice,
            });
          }
        }
      }

      // Sort by absolute percentage change
      cardChanges.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
      
      // Take top N changes
      const topChanges = cardChanges.slice(0, limit);
      
      // Fetch all card details in one batch for efficiency
      const allCards = await ctx.db.query("cards").collect();
      const cardsMap = new Map(allCards.map(card => [card._id, card]));
      
      // Combine card data with change data
      const results = topChanges
        .map((change) => {
          const card = cardsMap.get(change.itemId as any);
          if (!card) return null;
          
          return {
            ...card,
            itemType: "card" as const,
            yesterdayPrice: change.yesterdayPrice,
            todayPrice: change.todayPrice,
            dailyPercentChange: change.percentChange,
            percentChange: change.percentChange,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return results;
    } catch (error) {
      console.error("Error fetching daily changes:", error);
      // Return empty array to prevent client crashes
      return [];
    }
  },
});

// Cleanup old daily snapshots (keep last 365 days)
export const cleanupOldSnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneYearAgo = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    const oldSnapshots = await ctx.db
      .query("dailySnapshots")
      .filter((q) => q.lt(q.field("snapshotDate"), oneYearAgo))
      .collect();
    
    for (const snapshot of oldSnapshots) {
      await ctx.db.delete(snapshot._id);
    }
    
    return { deleted: oldSnapshots.length };
  },
});