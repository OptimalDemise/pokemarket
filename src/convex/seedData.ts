import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Seed initial data for testing - now fetches real data from Pokemon TCG API
export const seedInitialData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data first
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

    // Schedule the action to fetch real data
    await ctx.scheduler.runAfter(0, internal.pokemonTcgApi.updateAllCardsWithRealData, {});

    // Sample products data (keeping these as manual since product APIs are less common)
    const products = [
      {
        name: "Obsidian Flames Booster Box",
        productType: "Booster Box",
        setName: "Obsidian Flames",
        currentPrice: 119.99,
        imageUrl: "https://images.pokemontcg.io/swsh12/logo.png",
      },
      {
        name: "Paldea Evolved Booster Bundle",
        productType: "Booster Bundle",
        setName: "Paldea Evolved",
        currentPrice: 24.99,
        imageUrl: "https://images.pokemontcg.io/sv02/logo.png",
      },
      {
        name: "151 Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "151",
        currentPrice: 64.99,
        imageUrl: "https://images.pokemontcg.io/sv03/logo.png",
      },
      {
        name: "Scarlet & Violet Booster Box",
        productType: "Booster Box",
        setName: "Scarlet & Violet",
        currentPrice: 109.99,
        imageUrl: "https://images.pokemontcg.io/sv01/logo.png",
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