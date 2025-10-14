"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const POKEMON_TCG_API_BASE = "https://api.pokemontcg.io/v2";
const API_KEY = process.env.POKEMON_TCG_API_KEY || ""; // Optional but recommended for higher rate limits

interface PokemonCard {
  id: string;
  name: string;
  set: {
    name: string;
  };
  number: string;
  rarity: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url?: string;
    prices?: {
      holofoil?: { market?: number };
      reverseHolofoil?: { market?: number };
      normal?: { market?: number };
      "1stEditionHolofoil"?: { market?: number };
    };
  };
}

// Fetch card data from Pokemon TCG API
export const fetchCardData = internalAction({
  args: {
    cardName: v.string(),
    setName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }

      // Build query
      let query = `name:"${args.cardName}"`;
      if (args.setName) {
        query += ` set.name:"${args.setName}"`;
      }
      
      // Only fetch rare cards - comprehensive list using CORRECT API rarity names
      query += ` (rarity:"Rare Holo" OR rarity:"Rare Holo EX" OR rarity:"Rare Holo GX" OR rarity:"Rare Holo V" OR rarity:"Rare Holo VMAX" OR rarity:"Rare Holo VSTAR" OR rarity:"Rare Ultra" OR rarity:"Rare Rainbow" OR rarity:"Rare Secret" OR rarity:"Rare Shining" OR rarity:"Rare ACE" OR rarity:"Rare BREAK" OR rarity:"Rare Prime" OR rarity:"Rare Prism Star" OR rarity:"Amazing Rare" OR rarity:"Radiant Rare" OR rarity:"Hyper Rare" OR rarity:"Illustration Rare" OR rarity:"Special Illustration Rare" OR rarity:"Double Rare" OR rarity:"Shiny Rare" OR rarity:"Shiny Ultra Rare" OR rarity:"Trainer Gallery Rare Holo" OR rarity:"Black White Rare" OR rarity:"Rare Shiny GX" OR rarity:"Rare Holo Star" OR rarity:"Rare Holo LV.X" OR rarity:"LEGEND" OR rarity:"Promo")`;

      const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pokemon TCG API error: ${response.status} - ${errorText}`);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`No cards found for: ${args.cardName}`);
        return null;
      }

      // Get the first matching card
      const card: PokemonCard = data.data[0];
      
      // Extract price (prefer holofoil, then other variants)
      let price = 0;
      if (card.tcgplayer?.prices) {
        const prices = card.tcgplayer.prices;
        price = prices.holofoil?.market || 
                prices["1stEditionHolofoil"]?.market ||
                prices.reverseHolofoil?.market ||
                prices.normal?.market ||
                0;
      }

      return {
        name: card.name,
        setName: card.set.name,
        cardNumber: card.number,
        rarity: card.rarity,
        imageUrl: card.images.large,
        tcgplayerUrl: card.tcgplayer?.url,
        currentPrice: price > 0 ? price : 10.0, // Default to $10 if no price
      };
    } catch (error) {
      console.error("Error fetching card data:", error);
      throw new Error(`Failed to fetch card data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Fetch all cards above a certain price threshold (INCREMENTAL VERSION with cursor)
export const fetchAllCardsAbovePrice = internalAction({
  args: { 
    minPrice: v.number(), 
    maxPages: v.optional(v.number()),
    startPage: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }

      // Query for rare cards from all eras - using CORRECT API rarity names
      const query = `(rarity:"Rare Holo" OR rarity:"Rare Holo EX" OR rarity:"Rare Holo GX" OR rarity:"Rare Holo V" OR rarity:"Rare Holo VMAX" OR rarity:"Rare Holo VSTAR" OR rarity:"Rare Ultra" OR rarity:"Rare Rainbow" OR rarity:"Rare Secret" OR rarity:"Rare Shining" OR rarity:"Rare ACE" OR rarity:"Rare BREAK" OR rarity:"Rare Prime" OR rarity:"Rare Prism Star" OR rarity:"Amazing Rare" OR rarity:"Radiant Rare" OR rarity:"Hyper Rare" OR rarity:"Illustration Rare" OR rarity:"Special Illustration Rare" OR rarity:"Double Rare" OR rarity:"Shiny Rare" OR rarity:"Shiny Ultra Rare" OR rarity:"Trainer Gallery Rare Holo" OR rarity:"Black White Rare" OR rarity:"Rare Shiny GX" OR rarity:"Rare Holo Star" OR rarity:"Rare Holo LV.X" OR rarity:"LEGEND" OR rarity:"Promo")`;
      
      let successCount = 0;
      const errors: string[] = [];
      let totalProcessed = 0;
      
      // Start from the provided page or page 1
      let page = args.startPage || 1;
      let hasMorePages = true;
      
      // Limit pages per run to avoid timeouts (default 10 pages = ~2500 cards max)
      const MAX_PAGES = args.maxPages || 10;
      const endPage = page + MAX_PAGES - 1;

      // Fetch pages until no more data is available or hit page limit
      // Order by release date descending to prioritize newer sets
      while (hasMorePages && page <= endPage) {
        const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}&orderBy=-set.releaseDate&page=${page}&pageSize=250`;
        
        console.log(`Fetching page ${page}/${endPage}...`);
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          console.error(`API request failed for page ${page} with status ${response.status}`);
          // Stop if we get an error
          break;
        }

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.log(`No more cards on page ${page}, stopping.`);
          hasMorePages = false;
          break;
        }

        console.log(`Processing ${data.data.length} cards from page ${page}...`);
        totalProcessed += data.data.length;

        // Filter and process cards above the minimum price WITH DELAYS
        for (let i = 0; i < data.data.length; i++) {
          const card = data.data[i];
          try {
            let price = 0;
            if (card.tcgplayer?.prices) {
              const prices = card.tcgplayer.prices;
              price = prices.holofoil?.market || 
                      prices["1stEditionHolofoil"]?.market ||
                      prices.reverseHolofoil?.market ||
                      prices.normal?.market ||
                      0;
            }

            // Only add cards above the minimum price
            if (price >= args.minPrice) {
              await ctx.runMutation(internal.cards.upsertCard, {
                name: card.name,
                setName: card.set.name,
                cardNumber: card.number,
                rarity: card.rarity,
                imageUrl: card.images.large,
                tcgplayerUrl: card.tcgplayer?.url || undefined,
                currentPrice: price,
              });
              successCount++;
              
              // Add delay after each card insert to prevent bursts
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            if (errors.length < 20) {
              errors.push(`Failed to process ${card.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
        
        console.log(`Page ${page} complete. Total cards added so far: ${successCount}`);
        page++;
      }

      console.log(`Fetch complete. Total processed: ${totalProcessed}, Successfully added: ${successCount}`);
      console.log(`Stopped at page ${page - 1}. ${hasMorePages && page > endPage ? 'More pages available for next run.' : 'All pages processed.'}`);
      
      return { 
        success: successCount > 0, 
        updated: successCount,
        total: totalProcessed,
        nextPage: hasMorePages && page <= endPage ? page : null,
        isComplete: !hasMorePages || page > 100,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      };
    } catch (error) {
      console.error("Error fetching cards:", error);
      throw new Error(`Failed to fetch cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Update all cards with real data
export const updateAllCardsWithRealData = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; updated: number; total: number; errors?: string[] }> => {
    // TEMPORARY: Always fetch new cards to capture missing valuable cards (LIMITED TO 10 PAGES PER RUN)
    // TODO: Revert to 50% after comprehensive fetch is complete
    const shouldFetchNew = true; // Temporarily set to always fetch
    
    let result = { success: true, updated: 0, total: 0, errors: undefined as string[] | undefined };
    
    if (shouldFetchNew) {
      // Get the saved page cursor from last run
      const savedCursor = await ctx.runQuery(internal.updateProgress.getNewCardFetchCursor);
      const startPage = savedCursor ? parseInt(savedCursor) : 1;
      
      console.log(`Fetching new cards from API starting at page ${startPage} (incremental fetch mode - 10 pages per run)...`);
      
      const fetchResult = await ctx.runAction(internal.pokemonTcgApi.fetchAllCardsAbovePrice, {
        minPrice: 3,
        maxPages: 10,
        startPage: startPage,
      });
      
      result = fetchResult;
      
      // Save the next page to continue from
      if (fetchResult.nextPage) {
        await ctx.runMutation(internal.updateProgress.setNewCardFetchCursor, { 
          cursor: fetchResult.nextPage.toString() 
        });
        console.log(`Saved progress: will continue from page ${fetchResult.nextPage} next run`);
      } else if (fetchResult.isComplete) {
        // Reset cursor when complete
        await ctx.runMutation(internal.updateProgress.setNewCardFetchCursor, { cursor: null });
        console.log(`Fetch complete! All pages processed. Cursor reset.`);
      }
    }
    
    // Process existing cards with staggered updates
    const BATCH_SIZE = 30;
    const DELAY_BETWEEN_CARDS_MS = 300;
    const DELAY_BETWEEN_BATCHES_MS = 800;

    let fluctuationCount = 0;
    const processedCardIds = new Set<string>();
    
    console.log("Starting card update process...");
    console.log(`Target: Process cards in batches of ${BATCH_SIZE} with delays`);
    
    // Get the saved cursor from the last run
    let cursor: string | null = await ctx.runQuery(internal.updateProgress.getUpdateCursor);
    console.log(`Resuming from cursor: ${cursor || 'start'}`);
    
    let hasMore = true;
    let batchNumber = 0;
    let totalProcessed = 0;
    
    while (hasMore) {
      batchNumber++;
      
      // Fetch a batch of cards
      const batch: { page: any[]; continueCursor: string | null; isDone: boolean } = await ctx.runQuery(internal.cards._getCardsBatch, {
        cursor,
        batchSize: BATCH_SIZE,
      });
      
      if (!batch || batch.page.length === 0) {
        console.log("No more cards to process - resetting cursor to start");
        await ctx.runMutation(internal.updateProgress.setUpdateCursor, { cursor: null });
        hasMore = false;
        break;
      }
      
      console.log(`Batch ${batchNumber}: Processing ${batch.page.length} cards (cursor: ${cursor ? 'continuing' : 'start'})`);
      
      const setsInBatch = new Set(batch.page.map(card => card.setName));
      console.log(`Sets in this batch: ${Array.from(setsInBatch).join(', ')}`);
      
      // Process each card in the batch with delays
      for (const card of batch.page) {
        if (processedCardIds.has(card._id)) {
          console.warn(`Duplicate card detected: ${card.name} (${card.setName}) - skipping`);
          continue;
        }
        processedCardIds.add(card._id);
        
        try {
          const fluctuation = 0.97 + Math.random() * 0.06;
          const newPrice = parseFloat((card.currentPrice * fluctuation).toFixed(2));
          
          await ctx.runMutation(internal.cards.upsertCard, {
            name: card.name,
            setName: card.setName,
            cardNumber: card.cardNumber,
            rarity: card.rarity,
            imageUrl: card.imageUrl,
            tcgplayerUrl: card.tcgplayerUrl,
            currentPrice: newPrice,
          });
          
          fluctuationCount++;
          totalProcessed++;
          
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CARDS_MS));
        } catch (error) {
          console.error(`Error updating card ${card.name} from ${card.setName}:`, error);
        }
      }
      
      console.log(`Batch ${batchNumber} complete. Cards updated in this batch: ${batch.page.length}. Total updated so far: ${fluctuationCount}`);
      
      cursor = batch.continueCursor;
      await ctx.runMutation(internal.updateProgress.setUpdateCursor, { cursor });
      
      hasMore = !batch.isDone;
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
    }
    
    console.log(`Card update complete. Total batches processed: ${batchNumber}`);
    console.log(`Total unique cards updated: ${fluctuationCount} (out of ${totalProcessed} processed)`);
    console.log(`New cards fetched: ${result.updated}, Existing cards updated: ${fluctuationCount}`);
    
    return { 
      success: result.success, 
      updated: result.updated + fluctuationCount,
      total: result.total + fluctuationCount,
      errors: result.errors
    };
  },
});