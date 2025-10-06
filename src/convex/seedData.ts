import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Seed initial data for testing - now fetches real data from Pokemon TCG API
export const seedInitialData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Instead of deleting all data, just schedule the fetch
    // This avoids hitting the read limit when there are many existing cards
    
    // Schedule the action to fetch real data
    await ctx.scheduler.runAfter(0, internal.pokemonTcgApi.updateAllCardsWithRealData, {});

    // Sample products data with actual product images from Google
    const products = [
      {
        name: "Obsidian Flames Booster Box",
        productType: "Booster Box",
        setName: "Obsidian Flames",
        currentPrice: 119.99,
        imageUrl: "https://images.pokemontcg.io/swsh12/logo.png",
      },
      {
        name: "Paldea Evolved Booster Box",
        productType: "Booster Box",
        setName: "Paldea Evolved",
        currentPrice: 109.99,
        imageUrl: "https://images.pokemontcg.io/sv2/logo.png",
      },
      {
        name: "151 Booster Box",
        productType: "Booster Box",
        setName: "151",
        currentPrice: 149.99,
        imageUrl: "https://images.pokemontcg.io/sv3pt5/logo.png",
      },
      {
        name: "Scarlet & Violet Booster Box",
        productType: "Booster Box",
        setName: "Scarlet & Violet",
        currentPrice: 109.99,
        imageUrl: "https://images.pokemontcg.io/sv1/logo.png",
      },
      {
        name: "Temporal Forces Booster Box",
        productType: "Booster Box",
        setName: "Temporal Forces",
        currentPrice: 129.99,
        imageUrl: "https://images.pokemontcg.io/sv5/logo.png",
      },
      {
        name: "Twilight Masquerade Booster Box",
        productType: "Booster Box",
        setName: "Twilight Masquerade",
        currentPrice: 134.99,
        imageUrl: "https://images.pokemontcg.io/sv6/logo.png",
      },
      {
        name: "Shrouded Fable Booster Box",
        productType: "Booster Box",
        setName: "Shrouded Fable",
        currentPrice: 139.99,
        imageUrl: "https://images.pokemontcg.io/sv6pt5/logo.png",
      },
      {
        name: "Stellar Crown Booster Box",
        productType: "Booster Box",
        setName: "Stellar Crown",
        currentPrice: 129.99,
        imageUrl: "https://images.pokemontcg.io/sv7/logo.png",
      },
      {
        name: "Paldea Evolved Booster Bundle",
        productType: "Booster Bundle",
        setName: "Paldea Evolved",
        currentPrice: 24.99,
        imageUrl: "https://images.pokemontcg.io/sv2/logo.png",
      },
      {
        name: "Paradox Rift Booster Bundle",
        productType: "Booster Bundle",
        setName: "Paradox Rift",
        currentPrice: 29.99,
        imageUrl: "https://images.pokemontcg.io/sv4/logo.png",
      },
      {
        name: "Temporal Forces Booster Bundle",
        productType: "Booster Bundle",
        setName: "Temporal Forces",
        currentPrice: 27.99,
        imageUrl: "https://images.pokemontcg.io/sv5/logo.png",
      },
      {
        name: "Lost Origin Booster Bundle",
        productType: "Booster Bundle",
        setName: "Lost Origin",
        currentPrice: 27.99,
        imageUrl: "https://images.pokemontcg.io/swsh11/logo.png",
      },
      {
        name: "151 Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "151",
        currentPrice: 64.99,
        imageUrl: "https://images.pokemontcg.io/sv3pt5/logo.png",
      },
      {
        name: "Twilight Masquerade Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Twilight Masquerade",
        currentPrice: 54.99,
        imageUrl: "https://images.pokemontcg.io/sv6/logo.png",
      },
      {
        name: "Crown Zenith Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Crown Zenith",
        currentPrice: 69.99,
        imageUrl: "https://images.pokemontcg.io/swsh12pt5/logo.png",
      },
      {
        name: "Astral Radiance Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Astral Radiance",
        currentPrice: 59.99,
        imageUrl: "https://images.pokemontcg.io/swsh10/logo.png",
      },
      {
        name: "Stellar Crown Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Stellar Crown",
        currentPrice: 54.99,
        imageUrl: "https://images.pokemontcg.io/sv7/logo.png",
      },
      {
        name: "Obsidian Flames Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Obsidian Flames",
        currentPrice: 49.99,
        imageUrl: "https://images.pokemontcg.io/swsh12/logo.png",
      },
      {
        name: "Silver Tempest Booster Box",
        productType: "Booster Box",
        setName: "Silver Tempest",
        currentPrice: 114.99,
        imageUrl: "https://images.pokemontcg.io/swsh12/logo.png",
      },
      {
        name: "Brilliant Stars Booster Box",
        productType: "Booster Box",
        setName: "Brilliant Stars",
        currentPrice: 124.99,
        imageUrl: "https://images.pokemontcg.io/swsh9/logo.png",
      },
      {
        name: "Paradox Rift Booster Box",
        productType: "Booster Box",
        setName: "Paradox Rift",
        currentPrice: 119.99,
        imageUrl: "https://images.pokemontcg.io/sv4/logo.png",
      },
      {
        name: "Scarlet & Violet Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Scarlet & Violet",
        currentPrice: 49.99,
        imageUrl: "https://images.pokemontcg.io/sv1/logo.png",
      },
      {
        name: "Temporal Forces Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Temporal Forces",
        currentPrice: 52.99,
        imageUrl: "https://images.pokemontcg.io/sv5/logo.png",
      },
      {
        name: "Shrouded Fable Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "Shrouded Fable",
        currentPrice: 54.99,
        imageUrl: "https://images.pokemontcg.io/sv6pt5/logo.png",
      },
    ];

    const now = Date.now();

    for (const product of products) {
      const productId = await ctx.db.insert("products", {
        ...product,
        lastUpdated: now,
      });

      await ctx.db.insert("productPriceHistory", {
        productId,
        price: product.currentPrice,
        timestamp: now,
      });

      await ctx.db.insert("productPriceHistory", {
        productId,
        price: product.currentPrice * (0.92 + Math.random() * 0.16),
        timestamp: now - 3600000,
      });
    }

    return { success: true, message: "Data seeding initiated with real API data" };
  },
});

// Clear all data separately if needed
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingCards = await ctx.db.query("cards").collect();
    for (const card of existingCards) {
      await ctx.db.delete(card._id);
    }
    
    const existingCardHistory = await ctx.db.query("cardPriceHistory").collect();
    for (const history of existingCardHistory) {
      await ctx.db.delete(history._id);
    }

    const existingProducts = await ctx.db.query("products").collect();
    for (const product of existingProducts) {
      await ctx.db.delete(product._id);
    }
    
    const existingProductHistory = await ctx.db.query("productPriceHistory").collect();
    for (const history of existingProductHistory) {
      await ctx.db.delete(history._id);
    }

    return { success: true, message: "All data cleared" };
  },
});