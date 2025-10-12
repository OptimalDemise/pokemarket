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
      
      // Only fetch rare cards - comprehensive list
      query += ` (rarity:"Holo Rare" OR rarity:"Ultra Rare" OR rarity:"Secret Rare" OR rarity:"Rare Holo" OR rarity:"Rare Holo EX" OR rarity:"Rare Holo GX" OR rarity:"Rare Holo V" OR rarity:"Rare Holo VMAX" OR rarity:"Rare Holo VSTAR" OR rarity:"Rare Ultra" OR rarity:"Rare Rainbow" OR rarity:"Rare Secret" OR rarity:"Rare Shining" OR rarity:"Rare ACE" OR rarity:"Rare BREAK" OR rarity:"Rare Prime" OR rarity:"Rare Prism Star" OR rarity:"Amazing Rare" OR rarity:"Radiant Rare" OR rarity:"Hyper Rare" OR rarity:"Illustration Rare" OR rarity:"Special Illustration Rare" OR rarity:"Double Rare" OR rarity:"Shiny Rare" OR rarity:"Shiny Ultra Rare" OR rarity:"Trainer Gallery Rare Holo" OR rarity:"Promo")`;

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

// Fetch all cards above a certain price threshold
export const fetchAllCardsAbovePrice = internalAction({
  args: { minPrice: v.number() },
  handler: async (ctx, args) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }

      // Query for rare cards from all eras - comprehensive list of premium rarities
      const query = `(rarity:"Holo Rare" OR rarity:"Ultra Rare" OR rarity:"Secret Rare" OR rarity:"Rare Holo" OR rarity:"Rare Holo EX" OR rarity:"Rare Holo GX" OR rarity:"Rare Holo V" OR rarity:"Rare Holo VMAX" OR rarity:"Rare Holo VSTAR" OR rarity:"Rare Ultra" OR rarity:"Rare Rainbow" OR rarity:"Rare Secret" OR rarity:"Rare Shining" OR rarity:"Rare ACE" OR rarity:"Rare BREAK" OR rarity:"Rare Prime" OR rarity:"Rare Prism Star" OR rarity:"Amazing Rare" OR rarity:"Radiant Rare" OR rarity:"Hyper Rare" OR rarity:"Illustration Rare" OR rarity:"Special Illustration Rare" OR rarity:"Double Rare" OR rarity:"Shiny Rare" OR rarity:"Shiny Ultra Rare" OR rarity:"Trainer Gallery Rare Holo" OR rarity:"Promo")`;
      
      let successCount = 0;
      const errors: string[] = [];
      let totalProcessed = 0;
      let page = 1;
      let hasMorePages = true;

      // Fetch pages until no more data is available (no hard limit)
      // Order by release date descending to prioritize newer sets
      while (hasMorePages) {
        const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}&orderBy=-set.releaseDate&page=${page}&pageSize=250`;
        
        console.log(`Fetching page ${page}...`);
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
        
        // Safety limit to prevent infinite loops (set very high)
        if (page > 100) {
          console.log(`Reached safety limit of 100 pages (25,000 cards). Stopping.`);
          hasMorePages = false;
        }
      }

      console.log(`Fetch complete. Total processed: ${totalProcessed}, Successfully added: ${successCount}`);
      
      return { 
        success: successCount > 0, 
        updated: successCount,
        total: totalProcessed,
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
    // Only fetch new cards occasionally (skip for regular updates)
    // This prevents bursts of new card additions
    const shouldFetchNew = Math.random() < 0.3; // 30% chance to fetch new cards
    
    let result = { success: true, updated: 0, total: 0, errors: undefined as string[] | undefined };
    
    if (shouldFetchNew) {
      console.log("Fetching new cards from API...");
      result = await ctx.runAction(internal.pokemonTcgApi.fetchAllCardsAbovePrice, {
        minPrice: 3,
      });
    }
    
    // Process existing cards with staggered updates
    const BATCH_SIZE = 30; // Balanced batch size for reliable processing
    const DELAY_BETWEEN_CARDS_MS = 100; // Reduced from 500ms to speed up processing
    const DELAY_BETWEEN_BATCHES_MS = 500; // Reduced from 2000ms to speed up processing

    let fluctuationCount = 0;
    const processedCardIds = new Set<string>();
    
    console.log("Starting card update process...");
    console.log(`Target: Process cards in shuffled order with ${BATCH_SIZE} cards per batch`);
    
    // Collect all card IDs first
    let allCardIds: string[] = [];
    let cursor: string | null = null;
    let hasMore = true;
    
    console.log("Collecting all card IDs...");
    while (hasMore) {
      const batch: { page: any[]; continueCursor: string | null; isDone: boolean } = await ctx.runQuery(internal.cards._getCardsBatch, {
        cursor,
        batchSize: 250, // Larger batch for ID collection
      });
      
      if (!batch || batch.page.length === 0) {
        hasMore = false;
        break;
      }
      
      allCardIds.push(...batch.page.map(card => card._id));
      cursor = batch.continueCursor;
      hasMore = !batch.isDone;
    }
    
    console.log(`Collected ${allCardIds.length} card IDs. Shuffling...`);
    
    // Shuffle the card IDs array
    for (let i = allCardIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCardIds[i], allCardIds[j]] = [allCardIds[j], allCardIds[i]];
    }
    
    console.log("Processing cards in shuffled order...");
    
    // Process cards in batches
    let batchNumber = 0;
    for (let i = 0; i < allCardIds.length; i += BATCH_SIZE) {
      batchNumber++;
      const batchIds = allCardIds.slice(i, Math.min(i + BATCH_SIZE, allCardIds.length));
      
      console.log(`Batch ${batchNumber}: Processing ${batchIds.length} cards (${i + 1}-${Math.min(i + BATCH_SIZE, allCardIds.length)} of ${allCardIds.length})`);
      
      // Fetch card details for this batch
      const cards = await Promise.all(
        batchIds.map(id => ctx.runQuery(internal.cards._getCardById, { cardId: id as any }))
      );
      
      // Process each card in the batch with delays
      for (let j = 0; j < cards.length; j++) {
        const card = cards[j];
        
        if (!card) {
          console.warn(`Card not found for ID: ${batchIds[j]}`);
          continue;
        }
        
        // Track which cards we've processed
        if (processedCardIds.has(card._id)) {
          console.warn(`Duplicate card detected: ${card.name} (${card.setName}) - skipping`);
          continue;
        }
        processedCardIds.add(card._id);
        
        try {
          // Simulate realistic price fluctuations (±3%)
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
          
          // Add delay after each card update for smooth distribution
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CARDS_MS));
        } catch (error) {
          console.error(`Error updating card ${card.name} from ${card.setName}:`, error);
          // Continue processing even if one card fails
        }
      }
      
      console.log(`Batch ${batchNumber} complete. Cards updated in this batch: ${batchIds.length}. Total updated so far: ${fluctuationCount}`);
      
      // Add delay between batches
      if (i + BATCH_SIZE < allCardIds.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
    }
    
    console.log(`Card update complete. Total batches processed: ${batchNumber}`);
    console.log(`Total unique cards updated: ${fluctuationCount} (out of ${processedCardIds.size} processed)`);
    console.log(`New cards fetched: ${result.updated}, Existing cards updated: ${fluctuationCount}`);
    
    return { 
      success: result.success, 
      updated: result.updated + fluctuationCount,
      total: result.total + fluctuationCount,
      errors: result.errors
    };
  },
});