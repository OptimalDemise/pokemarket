"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const POKEMON_TCG_API_BASE = "https://api.pokemontcg.io/v2";
const API_KEY = process.env.POKEMON_TCG_API_KEY || "";

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

// Update all cards with real data - REWRITTEN for clean gradual updates
export const updateAllCardsWithRealData = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; updated: number; total: number; errors?: string[] }> => {
    console.log("Starting card update cycle...");
    
    // Fetch new cards occasionally (50% chance)
    const shouldFetchNew = Math.random() < 0.5;
    
    if (shouldFetchNew) {
      const savedCursor = await ctx.runQuery(internal.updateProgress.getNewCardFetchCursor);
      const startPage = savedCursor ? parseInt(savedCursor) : 1;
      
      console.log(`Fetching new cards from API starting at page ${startPage}...`);
      
      const fetchResult = await ctx.runAction(internal.pokemonTcgApi.fetchAllCardsAbovePrice, {
        minPrice: 3,
        maxPages: 5,
        startPage: startPage,
      });
      
      if (fetchResult.nextPage) {
        await ctx.runMutation(internal.updateProgress.setNewCardFetchCursor, { 
          cursor: fetchResult.nextPage.toString() 
        });
      } else if (fetchResult.isComplete) {
        await ctx.runMutation(internal.updateProgress.setNewCardFetchCursor, { cursor: null });
      }
    }
    
    // Update existing cards with simulated price fluctuations (±1%)
    console.log("Updating existing cards with ±1% price fluctuations...");
    
    // Get the saved cursor to resume from where we left off
    const savedUpdateCursor = await ctx.runQuery(internal.updateProgress.getUpdateCursor);
    
    // Fetch a batch of cards using pagination
    const batchSize = 50; // Process 50 cards per run
    const cardsBatch = await ctx.runQuery(internal.cards._getCardsBatch, {
      cursor: savedUpdateCursor,
      batchSize: batchSize,
    });
    
    let fluctuationCount = 0;
    const errors: string[] = [];
    
    // Calculate delay between updates to spread over ~8 minutes (leaving 2 min buffer)
    const totalUpdateTime = 8 * 60 * 1000; // 8 minutes in ms
    const delayPerCard = cardsBatch.page.length > 0 ? totalUpdateTime / cardsBatch.page.length : 0;
    
    for (let i = 0; i < cardsBatch.page.length; i++) {
      const card = cardsBatch.page[i];
      
      try {
        // Apply ±1% price fluctuation (0.99 to 1.01)
        const fluctuation = 0.99 + Math.random() * 0.02;
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
        
        // Add delay between cards to spread updates gradually
        if (delayPerCard > 0 && i < cardsBatch.page.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayPerCard));
        }
      } catch (error) {
        console.error(`Error updating card ${card.name}:`, error);
        if (errors.length < 10) {
          errors.push(`Failed to update ${card.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    // Save the cursor for the next run
    if (cardsBatch.isDone) {
      // We've processed all cards, reset cursor to start from beginning next time
      await ctx.runMutation(internal.updateProgress.setUpdateCursor, { cursor: null });
      console.log("Completed full cycle through all cards. Resetting cursor.");
    } else {
      // Save the continuation cursor to resume from this point next time
      await ctx.runMutation(internal.updateProgress.setUpdateCursor, { cursor: cardsBatch.continueCursor });
      console.log(`Processed ${fluctuationCount} cards. Saved cursor for next run.`);
    }
    
    console.log(`Card update complete. Updated ${fluctuationCount} cards with ±1% fluctuations`);
    
    return { 
      success: true, 
      updated: fluctuationCount,
      total: fluctuationCount,
      errors: errors.length > 0 ? errors : undefined
    };
  },
});