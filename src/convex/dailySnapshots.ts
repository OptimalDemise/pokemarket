import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Create daily snapshots for all cards and products (optimized with batching)
export const createDailySnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      // Collect all cards first (no pagination in mutations)
      const allCards = await ctx.db.query("cards").collect();
      let cardsProcessed = 0;
      
      for (const card of allCards) {
        // Check if snapshot already exists for today
        const existingSnapshot = await ctx.db
          .query("dailySnapshots")
          .withIndex("by_item_and_date", (q) =>
            q.eq("itemId", card._id).eq("snapshotDate", today)
          )
          .first();
        
        if (!existingSnapshot) {
          // Get yesterday's snapshot for comparison
          const yesterdaySnapshot = await ctx.db
            .query("dailySnapshots")
            .withIndex("by_item_and_date", (q) =>
              q.eq("itemId", card._id).eq("snapshotDate", yesterday)
            )
            .first();
          
          const yesterdayPrice = yesterdaySnapshot?.price || card.currentPrice;
          const dailyPercentChange = yesterdayPrice !== 0
            ? ((card.currentPrice - yesterdayPrice) / yesterdayPrice) * 100
            : 0;
          
          await ctx.db.insert("dailySnapshots", {
            itemId: card._id,
            itemType: "card",
            itemName: card.name,
            snapshotDate: today,
            price: card.currentPrice,
            yesterdayPrice,
            dailyPercentChange,
            timestamp: now,
          });
          cardsProcessed++;
        }
      }
      
      // Collect all products
      const allProducts = await ctx.db.query("products").collect();
      let productsProcessed = 0;
      
      for (const product of allProducts) {
        const existingSnapshot = await ctx.db
          .query("dailySnapshots")
          .withIndex("by_item_and_date", (q) =>
            q.eq("itemId", product._id).eq("snapshotDate", today)
          )
          .first();
        
        if (!existingSnapshot) {
          const yesterdaySnapshot = await ctx.db
            .query("dailySnapshots")
            .withIndex("by_item_and_date", (q) =>
              q.eq("itemId", product._id).eq("snapshotDate", yesterday)
            )
            .first();
          
          const yesterdayPrice = yesterdaySnapshot?.price || product.currentPrice;
          const dailyPercentChange = yesterdayPrice !== 0
            ? ((product.currentPrice - yesterdayPrice) / yesterdayPrice) * 100
            : 0;
          
          await ctx.db.insert("dailySnapshots", {
            itemId: product._id,
            itemType: "product",
            itemName: product.name,
            snapshotDate: today,
            price: product.currentPrice,
            yesterdayPrice,
            dailyPercentChange,
            timestamp: now,
          });
          productsProcessed++;
        }
      }
      
      console.log(`Created daily snapshots: ${cardsProcessed} cards, ${productsProcessed} products`);
      return { cardsProcessed, productsProcessed };
    } catch (error) {
      console.error("Error creating daily snapshots:", error);
      throw new Error(`Failed to create daily snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get top daily changes (optimized for high concurrency)
export const getTopDailyChanges = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Validate and sanitize limit
    const limit = Math.max(1, Math.min(100, args.limit || 10));
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      console.log(`[getTopDailyChanges] Fetching snapshots for today: ${today}, yesterday: ${yesterday}`);
      
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

      console.log(`[getTopDailyChanges] Found ${todaySnapshots.length} today snapshots, ${yesterdaySnapshots.length} yesterday snapshots`);

      // If no today snapshots exist yet, return empty array
      if (todaySnapshots.length === 0) {
        console.log("[getTopDailyChanges] No snapshots for today yet");
        return [];
      }

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
        
        // If no yesterday price, use today's price as baseline (0% change)
        const basePrice = yesterdayPrice || todaySnapshot.price;
        
        // Validate prices to prevent division by zero
        if (basePrice > 0 && todaySnapshot.price >= 0) {
          const percentChange = yesterdayPrice 
            ? ((todaySnapshot.price - yesterdayPrice) / yesterdayPrice) * 100
            : 0; // No change if no yesterday data
          
          // Only include if there's an actual change or if we want to show 0% changes
          if (!isNaN(percentChange) && isFinite(percentChange)) {
            cardChanges.push({
              itemId: todaySnapshot.itemId,
              percentChange,
              todayPrice: todaySnapshot.price,
              yesterdayPrice: basePrice,
            });
          }
        }
      }

      console.log(`[getTopDailyChanges] Calculated ${cardChanges.length} card changes`);

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

      console.log(`[getTopDailyChanges] Returning ${results.length} results`);
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