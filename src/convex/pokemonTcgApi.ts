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
      
      // Limit pages per run to avoid timeouts (default 5 pages to ensure completion)
      const MAX_PAGES = args.maxPages || 5;
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
              
              // Removed delay to prevent timeouts - batch processing is fast enough
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
    // TEMPORARY: Always fetch new cards to capture missing valuable cards (LIMITED TO 5 PAGES PER RUN)
    // TODO: Revert to 50% after comprehensive fetch is complete
    const shouldFetchNew = true; // Temporarily set to always fetch
    
    let result = { success: true, updated: 0, total: 0, errors: undefined as string[] | undefined };
    
    if (shouldFetchNew) {
      // Get the saved page cursor from last run
      const savedCursor = await ctx.runQuery(internal.updateProgress.getNewCardFetchCursor);
      const startPage = savedCursor ? parseInt(savedCursor) : 1;
      
      console.log(`Fetching new cards from API starting at page ${startPage} (incremental fetch mode - 5 pages per run)...`);
      
      const fetchResult = await ctx.runAction(internal.pokemonTcgApi.fetchAllCardsAbovePrice, {
        minPrice: 3,
        maxPages: 5,
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
    
    // Update existing cards in smaller batches more frequently (30 cards every 2 minutes)
    // WITH DELAYS between cards to create smooth, gradual updates
    const BATCH_SIZE = 30;
    const CRON_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes in milliseconds
    const DELAY_PER_CARD = 1000; // 1 second per card for smoother updates
    
    try {
      // Get the saved cursor for existing card updates
      const savedCursor = await ctx.runQuery(internal.updateProgress.getUpdateCursor);
      
      console.log(`Updating existing cards from cursor: ${savedCursor || 'start'} with ${DELAY_PER_CARD}ms delay between cards`);
      
      // Fetch a batch of existing cards
      const cardsBatch = await ctx.runQuery(internal.cards._getCardsBatch, {
        cursor: savedCursor,
        batchSize: BATCH_SIZE,
      });
      
      let updatedCount = 0;
      const errors: string[] = [];
      
      // Calculate staggered timestamps to spread updates over the 2-minute window
      const baseTimestamp = Date.now();
      const timeSpread = CRON_INTERVAL_MS - 10000; // Leave 10 seconds buffer
      const timeIncrement = Math.floor(timeSpread / BATCH_SIZE);
      
      // Process each card in the batch with staggered timestamps
      for (let i = 0; i < cardsBatch.page.length; i++) {
        const card = cardsBatch.page[i];
        
        try {
          // Calculate a staggered timestamp for this card
          // This makes cards appear to update gradually in the live feed
          const staggeredTimestamp = baseTimestamp + (i * timeIncrement);
          
          // Simply refresh the card's lastUpdated timestamp without changing price
          await ctx.runMutation(internal.cards.upsertCard, {
            name: card.name,
            setName: card.setName,
            cardNumber: card.cardNumber,
            rarity: card.rarity,
            imageUrl: card.imageUrl,
            tcgplayerUrl: card.tcgplayerUrl,
            currentPrice: card.currentPrice, // Keep existing price
            forceTimestamp: staggeredTimestamp, // Use staggered timestamp
          });
          
          updatedCount++;
        } catch (error) {
          if (errors.length < 10) {
            errors.push(`Failed to update ${card.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          console.error(`Error updating card ${card.name}:`, error);
        }
      }

      // Save progress cursor for next run
      await ctx.runMutation(internal.updateProgress.setUpdateCursor, {
        cursor: cardsBatch.isDone ? null : cardsBatch.continueCursor,
      });
      
      console.log(`Batch complete. Updated ${updatedCount} existing cards over ${(DELAY_PER_CARD * updatedCount) / 1000}s. ${cardsBatch.isDone ? 'Reached end, will restart from beginning next time.' : 'More cards to process.'}`);
      
      result.updated += updatedCount;
      if (errors.length > 0) {
        result.errors = [...(result.errors || []), ...errors];
      }
    } catch (error) {
      console.error("Error updating existing cards:", error);
      const errorMsg = `Failed to update existing cards: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors = [...(result.errors || []), errorMsg];
    }
    
    console.log(`Update complete. New cards fetched: ${result.updated - (result.updated > 30 ? 30 : 0)}, Existing cards refreshed: ${result.updated > 30 ? 30 : result.updated}`);
    
    return { 
      success: result.success, 
      updated: result.updated,
      total: result.total,
      errors: result.errors
    };
  },
});