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

// Get top daily changes (both cards and products combined)
export const getTopDailyChanges = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Get today's snapshots
      const todaySnapshots = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_date", (q) => q.eq("snapshotDate", today))
        .collect();

      // Get yesterday's snapshots
      const yesterdaySnapshots = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_date", (q) => q.eq("snapshotDate", yesterday))
        .collect();

      // Create a map of yesterday's prices
      const yesterdayPrices = new Map(
        yesterdaySnapshots.map(s => [s.itemId, s.price])
      );

      // Calculate changes
      const changes = [];
      
      for (const todaySnapshot of todaySnapshots) {
        const yesterdayPrice = yesterdayPrices.get(todaySnapshot.itemId);
        
        if (yesterdayPrice && yesterdayPrice !== 0) {
          const percentChange = ((todaySnapshot.price - yesterdayPrice) / yesterdayPrice) * 100;
          
          // Get full item details
          let itemDetails = null;
          if (todaySnapshot.itemType === "card") {
            itemDetails = await ctx.db.get(todaySnapshot.itemId as any);
          } else {
            itemDetails = await ctx.db.get(todaySnapshot.itemId as any);
          }

          if (itemDetails) {
            changes.push({
              ...itemDetails,
              itemType: todaySnapshot.itemType,
              yesterdayPrice,
              todayPrice: todaySnapshot.price,
              dailyPercentChange: percentChange,
            });
          }
        }
      }

      // Sort by absolute percentage change (biggest movers first)
      changes.sort((a, b) => Math.abs(b.dailyPercentChange) - Math.abs(a.dailyPercentChange));

      return changes.slice(0, limit);
    } catch (error) {
      console.error("Error fetching daily changes:", error);
      return [];
    }
  },
});
