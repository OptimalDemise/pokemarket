import { v } from "convex/values";
import { internalMutation, internalAction, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Internal mutation to create snapshots for a batch of cards
export const createDailySnapshotsBatch = internalMutation({
  args: {
    cardIds: v.array(v.id("cards")),
    today: v.string(),
    yesterday: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    let processed = 0;
    
    // Batch fetch all cards at once
    const cards = await Promise.all(
      args.cardIds.map(id => ctx.db.get(id))
    );
    
    // Batch fetch all today's snapshots
    const todaySnapshots = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_date", (q) => q.eq("snapshotDate", args.today))
      .collect();
    
    const todaySnapshotsMap = new Map(
      todaySnapshots.map(s => [s.itemId, s])
    );
    
    // Batch fetch all yesterday's snapshots
    const yesterdaySnapshots = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_date", (q) => q.eq("snapshotDate", args.yesterday))
      .collect();
    
    const yesterdaySnapshotsMap = new Map(
      yesterdaySnapshots.map(s => [s.itemId, s])
    );
    
    // Process cards
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardId = args.cardIds[i];
      
      if (!card) continue;
      
      // Check if snapshot already exists for today
      if (todaySnapshotsMap.has(cardId)) continue;
      
      // Get yesterday's snapshot for comparison
      const yesterdaySnapshot = yesterdaySnapshotsMap.get(cardId);
      const yesterdayPrice = yesterdaySnapshot?.price || card.currentPrice;
      const dailyPercentChange = yesterdayPrice !== 0
        ? ((card.currentPrice - yesterdayPrice) / yesterdayPrice) * 100
        : 0;
      
      await ctx.db.insert("dailySnapshots", {
        itemId: cardId,
        itemType: "card",
        itemName: card.name,
        snapshotDate: args.today,
        price: card.currentPrice,
        yesterdayPrice,
        dailyPercentChange,
        timestamp: args.now,
      });
      processed++;
    }
    
    return { processed };
  },
});

// Action to orchestrate batched snapshot creation using pagination
export const createDailySnapshots = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      console.log(`Starting daily snapshot creation for ${today}...`);
      
      // Use pagination to process cards in chunks without loading all at once
      const batchSize = 100;
      let cursor: string | null = null;
      let totalProcessed = 0;
      let batchNumber = 0;
      
      do {
        // Fetch a batch of cards using pagination
        const result: {
          page: Array<{ _id: any }>;
          isDone: boolean;
          continueCursor: string;
        } = await ctx.runQuery(internal.cards._getCardsBatch, {
          cursor,
          batchSize,
        });
        
        if (result.page.length === 0) break;
        
        const cardIds = result.page.map((card: any) => card._id);
        
        // Process this batch
        const batchResult = await ctx.runMutation(internal.dailySnapshots.createDailySnapshotsBatch, {
          cardIds,
          today,
          yesterday,
          now,
        });
        
        totalProcessed += batchResult.processed;
        batchNumber++;
        
        console.log(`Batch ${batchNumber}: Processed ${batchResult.processed} snapshots (${totalProcessed} total)`);
        
        // Update cursor for next iteration
        cursor = result.isDone ? null : result.continueCursor;
        
      } while (cursor !== null);
      
      console.log(`✅ Created daily snapshots: ${totalProcessed} cards processed`);
      return { cardsProcessed: totalProcessed };
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